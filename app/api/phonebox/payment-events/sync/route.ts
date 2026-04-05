import { NextResponse } from "next/server"
import { requirePhoneBoxToken, syncPhoneBoxPaymentEvents } from "@/lib/data/phonebox"

export async function POST(request: Request) {
  try {
    const token = await requirePhoneBoxToken(request)
    const body = await request.json().catch(() => ({} as any))
    const events = Array.isArray(body?.events) ? body.events : []
    const result = await syncPhoneBoxPaymentEvents(token, events)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({
      acceptedIds: [],
      rejectedIds: [],
      message: "Unauthorized",
    }, { status: 401 })
  }
}
