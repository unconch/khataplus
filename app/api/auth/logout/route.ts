import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSdk } from "@descope/nextjs-sdk/server"
import { resolveSharedCookieDomain } from "@/lib/auth-cookie-domain"

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

  const cookieStore = await cookies()
  const sessionToken =
    cookieStore.get("DS")?.value ||
    cookieStore.get("__Secure-DS")?.value

  if (sessionToken) {
    try {
      const sdk = createSdk()
      await sdk.logout(sessionToken)
    } catch (error) {
      console.warn("[AuthLogout] Descope logout API failed, continuing with local cookie cleanup:", error)
    }
  }

  const response = NextResponse.redirect(
    returnTo.startsWith("http://") || returnTo.startsWith("https://")
      ? returnTo
      : new URL(returnTo, url.origin)
  )
  const stale = new Date(0)
  const secure = process.env.NODE_ENV === "production"
  const domain = resolveSharedCookieDomain(url.hostname)
  const cookieNames = [
    "DS",
    "DSR",
    "__Secure-DS",
    "__Secure-DSR",
    "biometric_verified",
    "kp_auth_next",
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
