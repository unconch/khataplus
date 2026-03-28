import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"
import { getWebAuthnAuthenticationOptions } from "@/lib/webauthn"
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
  const body = await request.json().catch(() => ({} as any))
  const email = String(body?.email || "").trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }

  const userRows = await sql`SELECT id, email FROM profiles WHERE lower(email) = ${email} LIMIT 1`
  const user = userRows[0]
  if (!user?.id) {
    return NextResponse.json({ error: "No account found for this email." }, { status: 404 })
  }

  try {
    const { rpID } = resolveWebAuthnContext(request)
    const options = await getWebAuthnAuthenticationOptions(String(user.id), rpID)
    const transactionId = randomUUID()
    const cookieStore = await cookies()
    cookieStore.set("kp_passkey_login", JSON.stringify({
      transactionId,
      userId: String(user.id),
      email,
      challenge: options.challenge,
      createdAt: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    })

    return NextResponse.json({ transactionId, options, email })
  } catch (error: any) {
    console.error("[PasskeyLoginStart] Error:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Failed to start passkey login." }, { status: 500 })
  }
}
