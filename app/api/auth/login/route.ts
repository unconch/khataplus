export const runtime = "nodejs"
export const maxDuration = 10

import { NextResponse } from "next/server"
import { requestLoginOtp, verifyLoginOtp } from "@/lib/data/auth"

function toSafePath(next: unknown): string {
  if (typeof next !== "string") return "/app/dashboard"
  if (!next.startsWith("/") || next.startsWith("/auth/")) return "/app/dashboard"
  return next
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms)
    promise.then((value) => { clearTimeout(timer); resolve(value) })
          .catch((err) => { clearTimeout(timer); reject(err) })
  })
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

    if (!code) {
      const otp = await requestLoginOtp({ email, next })
      if (!otp.ok) {
        return NextResponse.json({ error: otp.error || "Failed to send verification code email." }, { status: otp.status || 400 })
      }
      return NextResponse.json({ ok: true, phase: "verify", maskedEmail: otp.maskedEmail || email, next })
    }

    const result = await withTimeout(verifyLoginOtp({ email, token: code, next }), 7000, "OTP_VERIFY")
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Invalid verification code." }, { status: result.status || 401 })
    }

    const orgSlug = result.org?.slug ? String(result.org.slug).trim() : ""
    const resolvedNext = orgSlug && (next === "/app/dashboard" || next.startsWith("/app/dashboard/"))
      ? next.replace(/^\/app\/dashboard/, `/app/${orgSlug}/dashboard`)
      : (result.redirectTo || next)

    const response = NextResponse.json({
      ok: true,
      phase: "done",
      next: resolvedNext,
      orgSlug: orgSlug || undefined,
    })

    const slugMatch = resolvedNext.match(/^\/app\/([^/]+)\/dashboard(?:\/|$)/)
    const persistedSlug = slugMatch?.[1] || orgSlug
    if (persistedSlug) {
      response.cookies.set("kp_org_slug", persistedSlug, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      })
    }
    return response
  } catch (error: any) {
    const message = String(error?.message || "")
    if (message.includes("OTP_VERIFY_TIMEOUT")) {
      return NextResponse.json({ error: "Verification timed out. Please try again." }, { status: 504 })
    }
    return NextResponse.json({ error: error?.message || "Login failed." }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, warm: true })
}
