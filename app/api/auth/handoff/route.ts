import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get("at")
    const refreshToken = searchParams.get("rt")
    const next = searchParams.get("next") || "/app/dashboard"

    if (!accessToken || !refreshToken) {
      console.warn("[AUTH_HANDOFF] Missing tokens in request")
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    const supabase = await createClient()

    // Set the session into browser cookies
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      console.error("[AUTH_HANDOFF] Supabase setSession error:", error.message)
      return NextResponse.redirect(new URL(`/auth/login?error=handoff_failed&msg=${encodeURIComponent(error.message)}`, request.url))
    }

    // Redirect to the intended destination (dashboard)
    const destUrl = new URL(next, request.url)
    console.log("[AUTH_HANDOFF] Success, redirecting to:", destUrl.href)
    
    return NextResponse.redirect(destUrl)
  } catch (err: any) {
    console.error("[AUTH_HANDOFF] Critical failure:", err.message)
    return NextResponse.json(
      { error: "Internal Server Error during session handoff", detail: err.message },
      { status: 500 }
    )
  }
}
