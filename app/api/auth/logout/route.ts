import { NextResponse } from "next/server"
import { resolveSharedCookieDomain } from "@/lib/auth-cookie-domain"
import { createSupabaseServerClientWithCookieCollector } from "@/lib/supabase/server"

function isSafeAbsoluteReturnTo(candidate: URL, current: URL): boolean {
  if (!["http:", "https:"].includes(candidate.protocol)) return false
  if (candidate.host === current.host) return true

  const currentHost = current.hostname.toLowerCase()
  const candidateHost = candidate.hostname.toLowerCase()

  if (currentHost.startsWith("demo.") && candidateHost === currentHost.slice(5)) {
    return true
  }

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

  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo
  }

  try {
    const parsed = new URL(returnTo)
    if (isSafeAbsoluteReturnTo(parsed, url)) {
      return parsed.toString()
    }
  } catch {
    // Fall through to safe default.
  }

  return "/auth/login"
}

async function handleLogout(request: Request) {
  const returnTo = resolveReturnTo(request)
  const url = new URL(request.url)
  const cookieHeader = request.headers.get("cookie")
  const initialCookies =
    cookieHeader
      ?.split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce<Array<{ name: string; value: string }>>((acc, entry) => {
        const idx = entry.indexOf("=")
        if (idx <= 0) return acc
        acc.push({ name: entry.slice(0, idx), value: entry.slice(idx + 1) })
        return acc
      }, []) || []

  try {
    const { client: supabase } = createSupabaseServerClientWithCookieCollector(initialCookies)
    await supabase.auth.signOut()
  } catch (error) {
    console.warn("[AuthLogout] Supabase signOut failed, continuing with local cookie cleanup:", error)
  }

  const response = NextResponse.redirect(
    returnTo.startsWith("http://") || returnTo.startsWith("https://")
      ? returnTo
      : new URL(returnTo, url.origin)
  )
  const stale = new Date(0)
  const secure = process.env.NODE_ENV === "production"
  const domain = resolveSharedCookieDomain(url.hostname)
  const supabaseCookieNames = initialCookies
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-"))

  const cookieNames = [
    "DS",
    "DSR",
    "__Secure-DS",
    "__Secure-DSR",
    "biometric_verified",
    "kp_auth_next",
    ...supabaseCookieNames,
  ]

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      expires: stale,
      maxAge: 0,
      path: "/",
      secure,
      sameSite: "lax",
    })
    if (domain) {
      response.cookies.set(name, "", {
        expires: stale,
        maxAge: 0,
        path: "/",
        secure,
        sameSite: "lax",
        domain,
      })
    }
  }

  return response
}

export async function GET(request: Request) {
  return handleLogout(request)
}

export async function POST(request: Request) {
  return handleLogout(request)
}
