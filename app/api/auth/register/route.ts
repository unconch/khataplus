import { NextResponse } from "next/server"
import { requestRegistrationOtp, verifyRegistrationOtp } from "@/lib/data/auth"
import { rateLimit, getIP } from "@/lib/rate-limit"

function toSafePath(next: unknown): string {
  if (typeof next !== "string") return "/app/dashboard"
  if (!next.startsWith("/") || next.startsWith("/auth/")) return "/app/dashboard"
  return next
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const code = String(body?.code || "").trim().replace(/\s+/g, "").replace(/^#/, "")
    const next = toSafePath(body?.next)

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
    }

    const ip = getIP(request.headers)

    if (!code) {
      // Send-OTP bucket: 3 requests per minute per IP
      await rateLimit(`auth-register-send:${ip}`, 3, 60_000)
      const otp = await requestRegistrationOtp({ name, email, next })
      if (!otp.ok) {
        return NextResponse.json({ error: otp.error || "Failed to send verification code email." }, { status: otp.status || 400 })
      }
      return NextResponse.json({
        ok: true,
        phase: "verify",
        maskedEmail: otp.maskedEmail || email,
        next,
      })
    }

    // Verify-OTP bucket: 6 requests per minute per IP (allows mistyped codes)
    await rateLimit(`auth-register-verify:${ip}`, 6, 60_000)
    const result = await verifyRegistrationOtp({ name, email, token: code, next })
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Invalid verification code." }, { status: result.status || 400 })
    }
    const orgSlug = result.org?.slug ? String(result.org.slug).trim() : ""
    const resolvedNext =
      orgSlug && (next === "/app/dashboard" || next.startsWith("/app/dashboard/"))
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
      response.cookies.set("kp_org_slug", persistedSlug, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 })
    }
    return response
  } catch (error: any) {
    if (error?.name === "RateLimitError") {
      return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 })
    }
    console.error("[Auth Register] Failed:", error)
    return NextResponse.json({ error: error?.message || "Registration failed." }, { status: 500 })
  }
}
