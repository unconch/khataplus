import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_challenge")
  cookieStore.delete("auth_context")
  cookieStore.delete("biometric_verified")
  return NextResponse.json({ error: "WebAuthn authentication is disabled." }, { status: 410 })
}
