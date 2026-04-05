import { NextResponse } from "next/server"
import { addSupplier } from "@/lib/data/suppliers"
import { requireOrgContext } from "@/lib/server/org-context"

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext()
    if (ctx instanceof NextResponse) return ctx

    const { name, phone, address, gstin } = await request.json()
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const supplier = await addSupplier({ name, phone, address, gstin }, ctx.orgId)
    return NextResponse.json(supplier)
  } catch (e: any) {
    console.error("Add supplier error:", e)
    return NextResponse.json({ error: e.message || "Failed to add supplier" }, { status: 500 })
  }
}
