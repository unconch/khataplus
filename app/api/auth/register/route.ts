import { NextResponse } from "next/server"
import { ensureProfile } from "@/lib/data/profiles"
import { resolvePostAuthPath } from "@/lib/auth-redirect"
import { resolveSharedCookieDomain } from "@/lib/auth-cookie-domain"
import { createSupabaseServerClientWithCookieCollector } from "@/lib/supabase/server"

function toSafePath(next: unknown): string {
  if (typeof next !== "string") return "/setup-organization"
  if (!next.startsWith("/") || next.startsWith("/auth/")) return "/setup-organization"
  return next
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

function mapOtpErrorMessage(message?: string): string {
  const raw = String(message || "")
  const normalized = raw.toLowerCase()
  if (normalized.includes("signups not allowed for otp")) {
    return "Supabase Email OTP is disabled. Enable Email provider and Email signups in Supabase Auth settings."
  }
  return raw || "Failed to send verification code."
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const code = String(body?.code || "").trim().replace(/\s+/g, "")
    const next = toSafePath(body?.next)
    const requestUrl = new URL(request.url)

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
    }

    const initialCookies =
      request.headers
        .get("cookie")
        ?.split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce<Array<{ name: string; value: string }>>((acc, entry) => {
          const idx = entry.indexOf("=")
          if (idx <= 0) return acc
          acc.push({ name: entry.slice(0, idx), value: entry.slice(idx + 1) })
          return acc
        }, []) || []

    const { client: supabase, pendingCookies } = createSupabaseServerClientWithCookieCollector(initialCookies)

    if (!code) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { name },
        },
      })

      if (error) {
        return NextResponse.json({ error: mapOtpErrorMessage(error.message) }, { status: 400 })
      }

      return NextResponse.json({
        ok: true,
        phase: "verify",
        maskedEmail: maskEmail(email),
        next,
      })
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    })

    if (error || !data.user?.id) {
      return NextResponse.json({ error: error?.message || "Invalid verification code." }, { status: 400 })
    }

    try {
      await ensureProfile(data.user.id, data.user.email || email, (data.user.user_metadata?.name as string) || name)
    } catch (err) {
      console.warn("[Auth Register] ensureProfile failed:", err)
    }

    try {
      const { registerSession } = await import("@/lib/session-governance")
      const sessionId = (data.session?.access_token || data.user.id).slice(-24)
      await registerSession(data.user.id, sessionId)
    } catch (err) {
      console.warn("[Auth Register] registerSession failed:", err)
    }

    const resolvedNext = await resolvePostAuthPath(data.user.id, next)
    const response = NextResponse.json({ ok: true, phase: "done", next: resolvedNext })
    const domain = resolveSharedCookieDomain(requestUrl.hostname)
    const secure = process.env.NODE_ENV === "production"

    for (const cookie of pendingCookies) {
      response.cookies.set(cookie.name, cookie.value, {
        ...cookie.options,
        path: "/",
        sameSite: "lax",
        secure,
        domain: domain || undefined,
      })
    }

    return response
  } catch (error: any) {
    console.error("[Auth Register] Failed:", error)
    return NextResponse.json({ error: error?.message || "Registration failed." }, { status: 500 })
  }
}
