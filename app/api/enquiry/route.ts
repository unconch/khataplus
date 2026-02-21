import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim()
    const phone = String(body?.phone || "").trim()

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Placeholder for future: persist to DB / send email / CRM webhook.
    console.log("[ENQUIRY]", {
      name,
      email,
      phone,
      company: String(body?.company || "").trim(),
      message: String(body?.message || "").trim(),
      plan: String(body?.plan || "business"),
      cycle: String(body?.cycle || "yearly"),
      source: String(body?.source || "pricing"),
      at: new Date().toISOString()
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[ENQUIRY_ERROR]", error)
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 })
  }
}
