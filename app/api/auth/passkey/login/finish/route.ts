import { NextResponse } from "next/server"
import { cookies } from "next/headers"
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("kp_passkey_login")
  cookieStore.delete("kp_passkey_session")
  cookieStore.delete("auth_challenge")
  return NextResponse.json({ error: "Passkey login is disabled." }, { status: 410 })
}
