import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isSafeAbsoluteReturnTo(candidate: URL, current: URL): boolean {
  if (!["http:", "https:"].includes(candidate.protocol)) return false
  if (candidate.host === current.host) return true
  const currentHost = current.hostname.toLowerCase()
  const candidateHost = candidate.hostname.toLowerCase()
  if (currentHost.startsWith("demo.") && candidateHost === currentHost.slice(5)) return true
  return false
}

function resolveReturnTo(request: Request): string {
  const url = new URL(request.url)
  const returnTo = url.searchParams.get("returnTo")
  const currentHost = url.hostname.toLowerCase()

  if (!returnTo) {
    if (currentHost.startsWith("demo.")) {
      const apexHost = currentHost.slice(5)
      const port = url.port ? `:${url.port}` : ""
      return `${url.protocol}//${apexHost}${port}/auth/login`
    }
    return "/auth/login"
  }

  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) return returnTo

  try {
    const parsed = new URL(returnTo)
    if (isSafeAbsoluteReturnTo(parsed, url)) return parsed.toString()
  } catch { }

  return "/auth/login"
}

async function handleLogout(request: Request) {
  const url = new URL(request.url)
  const returnTo = resolveReturnTo(request)

  // Sign out from Supabase
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.warn("[AuthLogout] signOut failed, continuing with cookie cleanup:", err)
  }

  const response = NextResponse.redirect(
    returnTo.startsWith("http://") || returnTo.startsWith("https://")
      ? returnTo
      : new URL(returnTo, url.origin)
  )

  // Clear all auth cookies
  const cookieHeader = request.headers.get("cookie") || ""
  const supabaseCookieNames = cookieHeader
    .split(";")
    .map((p) => p.trim().split("=")[0])
    .filter((name) => name.startsWith("sb-"))

  const cookieNames = [
    "DS", "DSR", "__Secure-DS", "__Secure-DSR",
    "biometric_verified", "kp_auth_next",
    ...supabaseCookieNames,
  ]

  const stale = new Date(0)
  const secure = process.env.NODE_ENV === "production"

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      expires: stale, maxAge: 0, path: "/", secure, sameSite: "lax",
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
