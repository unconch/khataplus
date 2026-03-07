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
    const code = String(body?.code || "").trim().replace(/\s+/g, "").replace(/^#/, "")
    const next = toSafePath(body?.next)

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const sdk = createSdk()

    if (!code) {
      let start = await sdk.otp.signIn.email(email)
      if (!start?.ok) {
        start = await sdk.otp.signUpOrIn.email(email)
      }
      if (!start?.ok) {
        const message = start?.error?.errorMessage || "Failed to send verification code email."
        return NextResponse.json({ error: message }, { status: 400 })
      }
      return NextResponse.json({
        ok: true,
        phase: "verify",
        maskedEmail: start?.data?.maskedEmail || email,
        next,
      })
    }

    const result = await sdk.otp.verify.email(email, code)
    if (!result?.ok || !result?.data?.sessionJwt) {
      const message = result?.error?.errorMessage || "Invalid verification code."
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const data = result.data

    const user = resolveUser(data, email)
    let resolvedNext = next
    if (user.userId && user.email) {
      try {
        await ensureProfile(user.userId, user.email, user.name || undefined)
      } catch (err) {
        console.warn("[Auth Login] ensureProfile failed:", err)
      }
      try {
        const { registerSession } = await import("@/lib/session-governance")
        await registerSession(user.userId, deriveSessionId(data.sessionJwt, user.userId))
      } catch (err) {
        console.warn("[Auth Login] registerSession failed:", err)
      }
      resolvedNext = await resolveSlugDashboardPath(user.userId, next)
    }

    const response = NextResponse.json({ ok: true, phase: "done", next: resolvedNext })
    const url = new URL(request.url)
    const secure = process.env.NODE_ENV === "production"
    // Use app-wide cookie path and safe TTL floor to avoid short-lived sessions across routes.
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
    console.error("[Auth Login] Failed:", error)
    return NextResponse.json({ error: error?.message || "Login failed." }, { status: 500 })
  }
}
