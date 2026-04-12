import "server-only"

import crypto from "crypto"
import { Redis } from "@upstash/redis"

export type AndroidPushRegistration = {
  installationId: string
  fcmToken: string
  deviceModel?: string | null
  appVersion?: string | null
}

export type AndroidPushRelease = {
  id: string
  version: string
  date?: string | null
  title: string
  summary: string
  highlights: string[]
  downloadUrl?: string | null
}

export type AndroidPushBroadcastResult = {
  attempted: number
  delivered: number
  failed: number
  invalidatedTokens: string[]
}

let redisClient: Redis | null | undefined
let cachedAccessToken: { token: string; expiresAt: number } | null = null

function getRedis() {
  if (redisClient !== undefined) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn("[AndroidPush] Missing Upstash Redis env vars. Push registration will be disabled.")
    redisClient = null
    return redisClient
  }

  redisClient = new Redis({ url, token })
  return redisClient
}

function normalizeKey(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  if (cachedAccessToken && cachedAccessToken.expiresAt - 60 > now) {
    return cachedAccessToken.token
  }

  const projectId = process.env.FCM_PROJECT_ID?.trim()
  const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim()
  const privateKey = process.env.FCM_PRIVATE_KEY?.trim()
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("FCM_SERVICE_ACCOUNT_NOT_CONFIGURED")
  }

  const normalizedPrivateKey = privateKey.replace(/\\n/g, "\n")
  const header = {
    alg: "RS256",
    typ: "JWT",
  }
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }

  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "")

  const signingInput = `${encode(header)}.${encode(payload)}`
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(signingInput)
  signer.end()
  const signature = signer.sign(normalizedPrivateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")

  const assertion = `${signingInput}.${signature}`
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  })

  if (!response.ok) {
    throw new Error(`Failed to mint FCM access token: ${response.status}`)
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) {
    throw new Error("FCM access token response missing access_token")
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + Number(data.expires_in || 3600),
  }

  return cachedAccessToken.token
}

async function sendToToken(token: string, release: AndroidPushRelease) {
  const accessToken = await getAccessToken()
  const projectId = process.env.FCM_PROJECT_ID?.trim()
  if (!projectId) {
    throw new Error("FCM_PROJECT_ID is required")
  }

  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        android: {
          priority: "HIGH",
        },
        data: {
          id: release.id,
          version: release.version,
          date: release.date || "",
          title: release.title,
          summary: release.summary,
          highlights: JSON.stringify(release.highlights || []),
          downloadUrl: release.downloadUrl || "",
        },
      },
    }),
  })

  if (response.ok) return { ok: true as const }

  const text = await response.text().catch(() => "")
  const status = response.status
  return {
    ok: false as const,
    status,
    error: text || `FCM request failed with HTTP ${status}`,
  }
}

export async function registerAndroidPushDevice(input: AndroidPushRegistration) {
  const redis = getRedis()
  if (!redis) {
    return { ok: false, disabled: true }
  }

  const installationId = input.installationId.trim()
  const token = input.fcmToken.trim()
  if (!installationId || !token) {
    throw new Error("installationId and fcmToken are required")
  }

  const record = {
    installationId,
    token,
    deviceModel: input.deviceModel?.trim() || null,
    appVersion: input.appVersion?.trim() || null,
    updatedAt: new Date().toISOString(),
  }

  await redis.set(`android:fcm:install:${installationId}`, JSON.stringify(record), { ex: 60 * 60 * 24 * 400 })
  await redis.sadd("android:fcm:tokens", token)
  await redis.set(`android:fcm:token:${normalizeKey(token)}`, JSON.stringify(record), { ex: 60 * 60 * 24 * 400 })

  return { ok: true, installationId }
}

export async function broadcastAndroidPush(release: AndroidPushRelease): Promise<AndroidPushBroadcastResult> {
  const redis = getRedis()
  if (!redis) {
    return { attempted: 0, delivered: 0, failed: 0, invalidatedTokens: [] }
  }

  const tokens = (await redis.smembers("android:fcm:tokens")) as string[] | undefined
  const uniqueTokens = Array.from(new Set((tokens || []).map((value) => String(value).trim()).filter(Boolean)))

  const invalidatedTokens: string[] = []
  let delivered = 0
  let failed = 0

  for (const token of uniqueTokens) {
    try {
      const result = await sendToToken(token, release)
      if (result.ok) {
        delivered += 1
        continue
      }

      failed += 1
      const shouldInvalidate = result.status === 404 || result.status === 400 || result.status === 410
      if (shouldInvalidate) {
        invalidatedTokens.push(token)
        await redis.srem("android:fcm:tokens", token)
        await redis.del(`android:fcm:token:${normalizeKey(token)}`)
      }
    } catch {
      failed += 1
    }
  }

  return {
    attempted: uniqueTokens.length,
    delivered,
    failed,
    invalidatedTokens,
  }
}
