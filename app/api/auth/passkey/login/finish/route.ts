import { NextResponse } from "next/server"
import { createSdk } from "@descope/nextjs-sdk/server"
import { ensureProfile } from "@/lib/data/profiles"
import { resolveSlugDashboardPath } from "@/lib/auth-redirect"
import { resolveSharedCookieDomain } from "@/lib/auth-cookie-domain"

function toSafePath(next: unknown): string {
  if (typeof next !== "string") return "/dashboard"
  if (!next.startsWith("/") || next.startsWith("/auth/")) return "/dashboard"
  return next
}

function resolveUser(data: any, fallbackEmail?: string) {
  const userId =
    data?.claims?.sub ||
    data?.claims?.userId ||
    data?.user?.userId ||
    data?.user?.sub ||
    null

  const email = data?.user?.email || fallbackEmail || null
  const name = data?.user?.name || data?.user?.givenName || null
  return { userId, email, name }
}

function resolveMaxAge(raw: unknown, fallbackSeconds: number): number {
  const value = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(value) || value <= 0) return fallbackSeconds
  return Math.max(Math.floor(value), fallbackSeconds)
}

function deriveSessionId(sessionJwt?: string, fallbackUserId?: string | null): string {
  const token = String(sessionJwt || "")
  if (token.length >= 24) return token.slice(-24)
  return String(fallbackUserId || "session").slice(-24)
}

const SESSION_COOKIE_FALLBACK_SECONDS = 60 * 60 * 24 * 30 // 30d
const REFRESH_COOKIE_FALLBACK_SECONDS = 60 * 60 * 24 * 90 // 90d

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const email = String(body?.email || "").trim().toLowerCase()
    const transactionId = String(body?.transactionId || "").trim()
    const responseBody = body?.response
    const next = toSafePath(body?.next)

    if (!email || !transactionId || !responseBody) {
      return NextResponse.json({ error: "Missing passkey verification payload." }, { status: 400 })
    }

    const sdk = createSdk()
    const verify = await sdk.webauthn.signIn.finish(transactionId, JSON.stringify(responseBody))
    if (!verify?.ok || !verify?.data?.sessionJwt) {
      const message = verify?.error?.errorMessage || "Passkey verification failed."
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const data = verify.data

    const user = resolveUser(data, email)
    let resolvedNext = next
    if (user.userId && user.email) {
      try {
        await ensureProfile(user.userId, user.email, user.name || undefined)
      } catch (err) {
        console.warn("[Passkey Login Finish] ensureProfile failed:", err)
      }
      try {
        const { registerSession } = await import("@/lib/session-governance")
        await registerSession(user.userId, deriveSessionId(data.sessionJwt, user.userId))
      } catch (err) {
        console.warn("[Passkey Login Finish] registerSession failed:", err)
      }
      resolvedNext = await resolveSlugDashboardPath(user.userId, next)
    }

    const response = NextResponse.json({ ok: true, next: resolvedNext })
    const url = new URL(request.url)
    const secure = process.env.NODE_ENV === "production"
    const path = "/"
    const domain = resolveSharedCookieDomain(url.hostname)
    const sessionMaxAge = resolveMaxAge(data.cookieMaxAge, SESSION_COOKIE_FALLBACK_SECONDS)
    const refreshMaxAge = resolveMaxAge(data.cookieMaxAge, REFRESH_COOKIE_FALLBACK_SECONDS)

    response.cookies.set("DS", data.sessionJwt, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path,
      domain,
      maxAge: sessionMaxAge,
    })

    if (data.refreshJwt) {
      response.cookies.set("DSR", data.refreshJwt, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path,
        domain,
        maxAge: refreshMaxAge,
      })
    }

    return response
  } catch (error: any) {
    console.error("[Passkey Login Finish] Failed:", error)
    return NextResponse.json({ error: error?.message || "Failed to finish passkey login." }, { status: 500 })
  }
}
