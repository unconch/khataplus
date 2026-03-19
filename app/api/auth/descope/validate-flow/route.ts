import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ ok: false, error: "Descope has been removed." }, { status: 410 })
}

