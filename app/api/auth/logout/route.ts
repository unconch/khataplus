import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

function resolveReturnTo(request: Request) {
  const url = new URL(request.url)
  const returnTo = url.searchParams.get("returnTo") || "/auth/login"

  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/auth/login"
  }

  return returnTo
}

async function handleLogout(request: Request) {
  const returnTo = resolveReturnTo(request)
  const url = new URL(request.url)

  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.warn("[AuthLogout] Supabase signOut failed, continuing with local cookie cleanup:", error)
  }

  const cookieStore = await cookies()

  const response = NextResponse.redirect(new URL(returnTo, url.origin))
  const stale = new Date(0)
  const cookieNames = [
    "biometric_verified",
    "kp_auth_next",
    "kp_org_slug",
    "kp_passkey_session",
    "kp_passkey_login",
  ]

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      expires: stale,
      maxAge: 0,
      path: "/",
    })
  }

  return response
}

export async function GET(request: Request) {
  return handleLogout(request)
}

export async function POST(request: Request) {
  return handleLogout(request)
}

