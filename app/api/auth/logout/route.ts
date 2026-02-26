import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSdk } from "@descope/nextjs-sdk/server"

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

  const response = NextResponse.redirect(new URL(returnTo, url.origin))
  const stale = new Date(0)
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

