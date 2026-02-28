import { NextResponse } from "next/server"
import { createSdk } from "@descope/nextjs-sdk/server"
import { ensureProfile } from "@/lib/data/profiles"

function toSafePath(next: unknown): string {
  if (typeof next !== "string") return "/dashboard"
  if (!next.startsWith("/") || next.startsWith("/auth/")) return "/dashboard"
  return next
}

function resolveUser(data: any, fallbackEmail?: string) {
  const userId =
    data?.claims?.sub ||
    data?.claims?.userId ||
    data?.user?.userId ||
    data?.user?.sub ||
    null

  const email = data?.user?.email || fallbackEmail || null
  const name = data?.user?.name || data?.user?.givenName || null
  return { userId, email, name }
}

function resolveMaxAge(raw: unknown, fallbackSeconds: number): number {
  const value = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(value) || value <= 0) return fallbackSeconds
  return Math.max(Math.floor(value), fallbackSeconds)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const email = String(body?.email || "").trim().toLowerCase()
    const transactionId = String(body?.transactionId || "").trim()
    const responseBody = body?.response
    const next = toSafePath(body?.next)

    if (!email || !transactionId || !responseBody) {
      return NextResponse.json({ error: "Missing passkey verification payload." }, { status: 400 })
    }

    const sdk = createSdk()
    const verify = await sdk.webauthn.signIn.finish(transactionId, JSON.stringify(responseBody))
    if (!verify?.ok || !verify?.data?.sessionJwt) {
      const message = verify?.error?.errorMessage || "Passkey verification failed."
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const data = verify.data
    const response = NextResponse.json({ ok: true, next })

    const secure = process.env.NODE_ENV === "production"
    const path = "/"
    const sessionMaxAge = resolveMaxAge(data.cookieMaxAge, 60 * 60 * 12)
    const refreshMaxAge = resolveMaxAge(data.cookieMaxAge, 60 * 60 * 24 * 30)

    response.cookies.set("DS", data.sessionJwt, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path,
      maxAge: sessionMaxAge,
    })

    if (data.refreshJwt) {
      response.cookies.set("DSR", data.refreshJwt, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path,
        maxAge: refreshMaxAge,
      })
    }

    const user = resolveUser(data, email)
    if (user.userId && user.email) {
      try {
        await ensureProfile(user.userId, user.email, user.name || undefined)
      } catch (err) {
        console.warn("[Passkey Login Finish] ensureProfile failed:", err)
      }
    }

    return response
  } catch (error: any) {
    console.error("[Passkey Login Finish] Failed:", error)
    return NextResponse.json({ error: error?.message || "Failed to finish passkey login." }, { status: 500 })
  }
}
