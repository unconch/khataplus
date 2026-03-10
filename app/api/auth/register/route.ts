import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const code = String(body?.code || "").trim()

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // STEP 1 — Send OTP
    if (!code) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { full_name: name }, // stored in raw_user_meta_data → profiles via trigger
        },
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ ok: true, phase: "verify" })
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
        { status: 400 }
      )
    }

    // Update profile name in case trigger missed it
    await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: name,
        email: data.user.email || email,
      })

    return NextResponse.json({
      ok: true,
      phase: "done",
      next: "/setup-organization",
    })

  } catch (err: any) {
    console.error("[Auth Register]", err)
    return NextResponse.json(
      { error: err?.message || "Registration failed." },
      { status: 500 }
    )
  }
}
