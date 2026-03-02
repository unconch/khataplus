import { NextResponse } from "next/server"
import { createSdk } from "@descope/nextjs-sdk/server"
import { cookies } from "next/headers"

function resolveOrigin(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim()
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim()
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const host = request.headers.get("host")?.trim()
  if (host) {
    const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"
    return `${protocol}://${host}`
  }

  try {
    return new URL(request.url).origin
  } catch {
    return "https://khataplus.online"
  }
}

function mapStartError(message: string): string {
  const msg = (message || "").toLowerCase()
  if (msg.includes("not found") || msg.includes("no credential") || msg.includes("passkey")) {
    return "No passkey found for this email on this device. Use login code or add a passkey from Settings."
  }
  if (msg.includes("origin") || msg.includes("rp id")) {
    return "Passkey is not available for this domain configuration yet. Use login code and try again later."
  }
  return message || "Failed to start passkey login."
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
      const message = mapStartError(start?.error?.errorMessage || "")
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
