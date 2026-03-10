import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function toSafePath(next: unknown): string {
  if (typeof next !== "string") return "/dashboard"
  if (!next.startsWith("/") || next.startsWith("/auth/")) return "/dashboard"
  return next
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()
    const code = String(body?.code || "").trim()
    const next = toSafePath(body?.next)

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const supabase = await createClient()

    // STEP 1 — Send OTP
    if (!code) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })

      if (error) {
        const msg = error.message.toLowerCase().includes("signups not allowed")
          ? "No account found for this email. Please sign up first."
          : error.message
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      return NextResponse.json({
        ok: true,
        phase: "verify",
        maskedEmail: maskEmail(email),
      })
    }

    // STEP 2 — Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    })

    if (error || !data.user?.id) {
      return NextResponse.json(
        { error: error?.message || "Invalid verification code." },
        { status: 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      phase: "done",
      next,
    })

  } catch (err: any) {
    console.error("[Auth Login]", err)
    return NextResponse.json(
      { error: err?.message || "Login failed." },
      { status: 500 }
    )
  }
}
