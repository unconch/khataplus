import { NextResponse } from "next/server"
import { createSdk } from "@descope/nextjs-sdk/server"
import { ensureProfile } from "@/lib/data/profiles"

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
    const response = NextResponse.json({ ok: true, phase: "done", next })

    const secure = process.env.NODE_ENV === "production"
    // Use app-wide cookie path and safe TTL floor to avoid short-lived sessions across routes.
    const path = "/"
    const sessionMaxAge = resolveMaxAge(data.cookieMaxAge, 60 * 60 * 12) // 12h minimum
    const refreshMaxAge = resolveMaxAge(data.cookieMaxAge, 60 * 60 * 24 * 30) // 30d minimum

    response.cookies.set("DS", data.sessionJwt, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path,
      maxAge: sessionMaxAge,
    })

    if (data.refreshJwt) {
      response.cookies.set("DSR", data.refreshJwt, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path,
        maxAge: refreshMaxAge,
      })
    }

    const user = resolveUser(data, email)
    if (user.userId && user.email) {
      try {
        await ensureProfile(user.userId, user.email, user.name || undefined)
      } catch (err) {
        console.warn("[Auth Login] ensureProfile failed:", err)
      }
    }

    return response
  } catch (error: any) {
    console.error("[Auth Login] Failed:", error)
    return NextResponse.json({ error: error?.message || "Login failed." }, { status: 500 })
  }
}
