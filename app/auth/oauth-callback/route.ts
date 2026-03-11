import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl

  const next =
    (searchParams.get("next") || "/dashboard").startsWith("/") &&
      !(searchParams.get("next") || "").startsWith("/auth/")
      ? searchParams.get("next")!
      : "/dashboard"

  try {
    const supabase = await createClient()

    // Exchange code for session (OAuth flow)
    const code = searchParams.get("code")
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    }

    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user?.id) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_user`)
    }

    const redirectTo = next.startsWith("/") ? next : "/onboarding"

    const response = NextResponse.redirect(`${origin}${redirectTo}`)
    response.cookies.delete("kp_auth_next")
    return response

  } catch (err) {
    console.error("[AuthOAuthCallback] Failed:", err)
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
  }
}
