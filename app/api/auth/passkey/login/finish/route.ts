import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyWebAuthnAuthentication } from "@/lib/webauthn"
import { buildPasskeySessionCookieValue } from "@/lib/data/auth"
import { sql } from "@/lib/db"

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

  const credentialCheck = await sql`
    SELECT 1 FROM webauthn_credentials WHERE user_id = ${userId} LIMIT 1
  `
  if (credentialCheck.length === 0) {
    return NextResponse.json({ error: "No passkey found for this account." }, { status: 404 })
  }

  try {
    const verification = await verifyWebAuthnAuthentication(userId, body?.response ?? body, challenge)
    if (!verification.verified) {
      return NextResponse.json({ error: "Passkey verification failed." }, { status: 400 })
    }

    const sessionCookie = buildPasskeySessionCookieValue(userId, email)
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
