import "server-only"

import { Redis } from "@upstash/redis"

let redisClient: Redis | null = null

function getRedis() {
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    redisClient = new Redis({ url, token })
    return redisClient
  }

  console.warn("[SessionGovernance] Missing Upstash Redis env vars. Session checks will be skipped.")
  return null
}

const MAX_CONCURRENT_SESSIONS = 3
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export type SessionSnapshot = {
  id: string
  createdAt: number
  lastSeenAt: number
  deviceLabel: string
  browser: string | null
  os: string | null
  ipAddress: string | null
  isCurrent: boolean
}

export type SessionListItem = SessionSnapshot

type SessionMetadata = {
  id: string
  userId: string
  createdAt: number
  lastSeenAt: number
  deviceLabel: string
  browser: string | null
  os: string | null
  ipAddress: string | null
  userAgent: string | null
}

type RegisterSessionInput = {
  userId: string
  sessionId: string
  userAgent?: string | null
  ipAddress?: string | null
  now?: number
}

function sessionsKey(userId: string) {
  return `user:sessions:${userId}`
}

type CookieReader = {
  get(name: string): { value?: string } | undefined
}

function sessionMetaKey(sessionId: string) {
  return `session:meta:${sessionId}`
}

function normalizeUserAgent(value: string | null | undefined) {
  const ua = String(value || "").trim()
  return ua || null
}

function extractIpAddress(headersLike: Headers | { get(name: string): string | null | undefined }) {
  const forwardedFor = headersLike.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = headersLike.get("x-real-ip")
  if (realIp) return String(realIp).trim()

  return null
}

function detectBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes("edg/")) return "Microsoft Edge"
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera"
  if (ua.includes("chrome/") && !ua.includes("edg/") && !ua.includes("opr/")) return "Chrome"
  if (ua.includes("firefox/")) return "Firefox"
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari"
  if (ua.includes("samsungbrowser/")) return "Samsung Internet"

  return "Browser"
}

function detectOs(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes("windows")) return "Windows"
  if (ua.includes("android")) return "Android"
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS"
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macOS"
  if (ua.includes("linux")) return "Linux"

  return "Unknown OS"
}

function detectDeviceLabel(userAgent: string, browser: string, os: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes("iphone")) return "iPhone"
  if (ua.includes("ipad")) return "iPad"
  if (ua.includes("android") && ua.includes("mobile")) return "Android phone"
  if (ua.includes("android")) return "Android tablet"
  if (ua.includes("windows")) return `Windows device (${browser})`
  if (ua.includes("macintosh") || ua.includes("mac os x")) return `Mac device (${browser})`
  if (ua.includes("linux")) return `Linux device (${browser})`

  return `${os} device`
}

export function describeSession(headersLike: Headers | { get(name: string): string | null | undefined }) {
  const userAgent = normalizeUserAgent(headersLike.get("user-agent"))

  if (!userAgent) {
    return {
      userAgent: null,
      browser: null,
      os: null,
      deviceLabel: "Unknown device",
      ipAddress: extractIpAddress(headersLike),
    }
  }

  const browser = detectBrowser(userAgent)
  const os = detectOs(userAgent)

  return {
    userAgent,
    browser,
    os,
    deviceLabel: detectDeviceLabel(userAgent, browser, os),
    ipAddress: extractIpAddress(headersLike),
  }
}

async function readSessionMetadata(sessionId: string) {
  const redis = getRedis()
  if (!redis) return null

  const raw = await redis.get<string | SessionMetadata>(sessionMetaKey(sessionId))
  if (!raw) return null

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as SessionMetadata
    } catch {
      return null
    }
  }

  return raw as SessionMetadata
}

async function writeSessionMetadata(metadata: SessionMetadata) {
  const redis = getRedis()
  if (!redis) return

  await redis.set(sessionMetaKey(metadata.id), JSON.stringify(metadata), { ex: SESSION_TTL_SECONDS })
}

async function trimExcessSessions(userId: string) {
  const redis = getRedis()
  if (!redis) return

  const sessionIds = await redis.smembers<string[]>(sessionsKey(userId))
  if (sessionIds.length <= MAX_CONCURRENT_SESSIONS) return

  const metadata = await Promise.all(sessionIds.map((sessionId) => readSessionMetadata(sessionId)))
  const ordered = sessionIds
    .map((sessionId, index) => ({
      sessionId,
      lastSeenAt: metadata[index]?.lastSeenAt || metadata[index]?.createdAt || 0,
    }))
    .sort((a, b) => a.lastSeenAt - b.lastSeenAt)

  const overflow = ordered.slice(0, Math.max(0, ordered.length - MAX_CONCURRENT_SESSIONS))
  for (const item of overflow) {
    await revokeSession(userId, item.sessionId)
  }
}

export async function registerSession(input: RegisterSessionInput) {
  const redis = getRedis()
  if (!redis || !input.sessionId) return

  const now = input.now || Date.now()
  const existing = await readSessionMetadata(input.sessionId)
  const described = describeSession({
    get(name: string) {
      if (name.toLowerCase() === "user-agent") return input.userAgent || null
      if (name.toLowerCase() === "x-forwarded-for") return input.ipAddress || null
      return null
    },
  })

  const next: SessionMetadata = {
    id: input.sessionId,
    userId: input.userId,
    createdAt: existing?.createdAt || now,
    lastSeenAt: now,
    deviceLabel: existing?.deviceLabel || described.deviceLabel,
    browser: described.browser || existing?.browser || null,
    os: described.os || existing?.os || null,
    ipAddress: described.ipAddress || existing?.ipAddress || null,
    userAgent: described.userAgent || existing?.userAgent || null,
  }

  await redis.sadd(sessionsKey(input.userId), input.sessionId)
  await writeSessionMetadata(next)
  await trimExcessSessions(input.userId)
}

export async function revokeAllSessions(userId: string) {
  const redis = getRedis()
  if (!redis) return

  const key = sessionsKey(userId)
  const sessions = await redis.smembers<string[]>(key)

  for (const sessionId of sessions) {
    await redis.set(`revoked:session:${sessionId}`, "true", { ex: 3600 * 24 })
    await redis.del(sessionMetaKey(sessionId))
  }

  await redis.del(key)
  await redis.set(`user:min_iat:${userId}`, Math.floor(Date.now() / 1000))
}

export async function getUserSessions(userId: string, currentSessionId = ""): Promise<SessionSnapshot[]> {
  const redis = getRedis()
  if (!redis) {
    return currentSessionId
      ? [
          {
            id: currentSessionId,
            createdAt: Date.now(),
            lastSeenAt: Date.now(),
            deviceLabel: "This device",
            browser: null,
            os: null,
            ipAddress: null,
            isCurrent: true,
          },
        ]
      : []
  }

  const sessionIds = await redis.smembers<string[]>(sessionsKey(userId))
  const metadata = await Promise.all(sessionIds.map((sessionId) => readSessionMetadata(sessionId)))

  return sessionIds
    .map((sessionId, index) => {
      const item = metadata[index]
      const createdAt = item?.createdAt || Date.now()
      const lastSeenAt = item?.lastSeenAt || createdAt
      return {
        id: sessionId,
        createdAt,
        lastSeenAt,
        deviceLabel: item?.deviceLabel || "Unknown device",
        browser: item?.browser || null,
        os: item?.os || null,
        ipAddress: item?.ipAddress || null,
        isCurrent: sessionId === currentSessionId,
      }
    })
    .sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1
      if (!a.isCurrent && b.isCurrent) return 1
      return b.lastSeenAt - a.lastSeenAt
    })
}

export function getCurrentSessionIdFromCookies(cookieStore: CookieReader): string {
  const sessionJwt =
    cookieStore.get("DS")?.value ||
    cookieStore.get("__Secure-DS")?.value ||
    ""

  return sessionJwt ? sessionJwt.slice(-24) : ""
}

export function buildSessionList(
  sessions: SessionSnapshot[],
  currentSessionId = ""
): SessionListItem[] {
  return sessions
    .map((session) => ({
      ...session,
      isCurrent: session.isCurrent || session.id === currentSessionId,
    }))
    .sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1
      if (!a.isCurrent && b.isCurrent) return 1
      return b.lastSeenAt - a.lastSeenAt
    })
}

export async function revokeSession(userId: string, sessionId: string) {
  const redis = getRedis()
  if (!redis) return

  await redis.srem(sessionsKey(userId), sessionId)
  await redis.set(`revoked:session:${sessionId}`, "true", { ex: 3600 * 24 })
  await redis.del(sessionMetaKey(sessionId))
}

export async function isSessionValid(userId: string, sessionId: string, iat?: number): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true

  const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))

  try {
    const result = await Promise.race([
      (async () => {
        const isRevoked = await redis.get(`revoked:session:${sessionId}`)
        if (isRevoked) return false

        if (iat) {
          const minIat = await redis.get<number>(`user:min_iat:${userId}`)
          if (minIat && iat < minIat) return false
        }

        return true
      })(),
      timeoutPromise,
    ])

    return result
  } catch (err: any) {
    console.warn("[SessionGovernance] Validation timed out or failed, failing open:", err?.message || err)
    return true
  }
}
