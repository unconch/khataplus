import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/data/auth"
import { addSupplierTransaction } from "@/lib/data/suppliers"
import { requireOrgContext } from "@/lib/server/org-context"

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext()
    if (ctx instanceof NextResponse) return ctx

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { supplierId, type, amount, note } = await request.json()
    if (!supplierId || !type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const transaction = await addSupplierTransaction(
      {
        supplier_id: supplierId,
        type,
        amount,
        note,
        invoice_no: null,
        created_by: user.userId,
        org_id: ctx.orgId,
      },
      ctx.orgId
    )
    return NextResponse.json(transaction)
  } catch (e: any) {
    console.error("Add supplier tx error:", e)
    return NextResponse.json({ error: e.message || "Failed to record transaction" }, { status: 500 })
  }
}
