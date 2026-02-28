import { NextResponse } from "next/server"
import { createSdk } from "@descope/nextjs-sdk/server"
import { cookies } from "next/headers"

function resolveOrigin(request: Request): string {
  const envOrigin = process.env.NEXT_PUBLIC_ORIGIN?.trim()
  if (envOrigin) return envOrigin
  try {
    return new URL(request.url).origin
  } catch {
    return "http://localhost:3000"
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const email = String(body?.email || "").trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const sdk = createSdk()
    const origin = resolveOrigin(request)
    const start = await sdk.webauthn.signIn.start(email, origin)

    if (!start?.ok || !start?.data?.transactionId || !start?.data?.options) {
      const message = start?.error?.errorMessage || "Failed to start passkey login."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    let options: unknown = null
    try {
      options = JSON.parse(String(start.data.options))
    } catch {
      return NextResponse.json({ error: "Invalid passkey options from auth provider." }, { status: 500 })
    }

    const cookieStore = await cookies()
    cookieStore.set("kp_passkey_txn", start.data.transactionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    })

    return NextResponse.json({
      ok: true,
      transactionId: start.data.transactionId,
      transactionID: start.data.transactionId,
      options,
      publicKey: (options as any)?.publicKey || options,
    })
  } catch (error: any) {
    console.error("[Passkey Login Start] Failed:", error)
    return NextResponse.json({ error: error?.message || "Failed to start passkey login." }, { status: 500 })
  }
}
