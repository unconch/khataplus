import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "Passkey login endpoint is disabled. Use Supabase OTP login.",
      code: "PASSKEY_LOGIN_DISABLED",
    },
    { status: 410 }
  )
}
