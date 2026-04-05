import { NextResponse } from "next/server"
import { addCustomer } from "@/lib/data/customers"
import { requireOrgContext } from "@/lib/server/org-context"

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext()
    if (ctx instanceof NextResponse) return ctx

    const { name, phone, address } = await request.json()
    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    const customer = await addCustomer({ name, phone, address }, ctx.orgId)
    return NextResponse.json(customer)
  } catch (e: any) {
    console.error("Add customer error:", e)
    return NextResponse.json({ error: e.message || "Failed to add customer" }, { status: 500 })
  }
}
