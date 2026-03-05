import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "Sentry tunnel disabled" }, { status: 410 })
}
