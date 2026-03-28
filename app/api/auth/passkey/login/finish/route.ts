import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyWebAuthnAuthentication } from "@/lib/webauthn"
import { buildPasskeySessionCookieValue } from "@/lib/data/auth"
import { sql } from "@/lib/db"

function resolveWebAuthnContext(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim()
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim()
  const rawHost = forwardedHost || request.headers.get("host") || "localhost:3000"
  const host = rawHost.split(",")[0].trim()
  const rpID = host.replace(/:\d+$/, "")
  const protocol = forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
  return { origin: `${protocol}://${host}`, rpID }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const loginStateRaw = cookieStore.get("kp_passkey_login")?.value
  if (!loginStateRaw) {
    return NextResponse.json({ error: "Missing passkey login state." }, { status: 400 })
  }

  let loginState: { transactionId?: string; userId?: string; email?: string; challenge?: string } = {}
  try {
    loginState = JSON.parse(loginStateRaw)
  } catch {
    return NextResponse.json({ error: "Invalid passkey login state." }, { status: 400 })
  }

  const body = await request.json().catch(() => ({} as any))
  const email = String(body?.email || "").trim().toLowerCase()
  const transactionId = String(body?.transactionId || "").trim()
  if (!email || !transactionId || transactionId !== loginState.transactionId || email !== String(loginState.email || "").trim().toLowerCase()) {
    return NextResponse.json({ error: "Passkey login request expired or mismatched." }, { status: 400 })
  }

  const userId = String(loginState.userId || "").trim()
  const challenge = String(loginState.challenge || "").trim()
  if (!userId || !challenge) {
    return NextResponse.json({ error: "Missing passkey verification data." }, { status: 400 })
  }

  const response = body?.response ?? body
  const credentialId = String(response?.id || body?.id || "").trim()
  if (!credentialId) {
    return NextResponse.json({ error: "Missing passkey credential id." }, { status: 400 })
  }

  const credentialRows = await sql`
    SELECT credential_id, user_id FROM webauthn_credentials
    WHERE credential_id = ${credentialId}
    LIMIT 1
  `
  if (credentialRows.length === 0) {
    return NextResponse.json({ error: "No passkey found for this account." }, { status: 404 })
  }

  const credentialOwnerId = String(credentialRows[0].user_id || "").trim()
  if (!credentialOwnerId) {
    return NextResponse.json({ error: "Passkey credential owner could not be resolved." }, { status: 400 })
  }

  const ownerProfile = await sql`
    SELECT email FROM profiles WHERE id = ${credentialOwnerId} LIMIT 1
  `
  const ownerEmail = String(ownerProfile[0]?.email || email).trim().toLowerCase()

  try {
    const { origin, rpID } = resolveWebAuthnContext(request)
    const verification = await verifyWebAuthnAuthentication(credentialOwnerId, response, challenge, origin, rpID)
    if (!verification.verified) {
      return NextResponse.json({ error: "Passkey verification failed." }, { status: 400 })
    }

    const sessionCookie = await buildPasskeySessionCookieValue(credentialOwnerId, ownerEmail)
    cookieStore.set("kp_passkey_session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    cookieStore.delete("kp_passkey_login")
    cookieStore.delete("auth_challenge")

    return NextResponse.json({ success: true, next: body?.next || "/app/dashboard" })
  } catch (error: any) {
    console.error("[PasskeyLoginFinish] Error:", error?.message || error)
    return NextResponse.json({ error: "Failed to verify passkey login." }, { status: 500 })
  }
}
