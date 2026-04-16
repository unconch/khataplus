import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accessToken = searchParams.get("at")
  const refreshToken = searchParams.get("rt")
  const next = searchParams.get("next") || "/app/dashboard"

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const supabase = await createClient()

  // Set the session into browser cookies
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) {
    console.error("[AUTH_HANDOFF] Failed to set session:", error.message)
    return NextResponse.redirect(new URL("/auth/login?error=handoff_failed", request.url))
  }

  // Redirect to the intended destination (dashboard)
  const response = NextResponse.redirect(new URL(next, request.url))
  
  // Ensure we clean up any potential artifacts
  return response
}
