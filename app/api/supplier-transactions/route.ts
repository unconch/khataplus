import { NextResponse } from "next/server"
import { session } from "@descope/nextjs-sdk/server"
import { addSupplierTransaction, getCurrentOrgId } from "@/lib/data"

export async function POST(request: Request) {
    try {
        const currSession = await session()
        const userId = (currSession as any)?.token?.sub

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { supplierId, type, amount, note, orgId: providedOrgId } = await request.json()

        if (!supplierId || !type || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const orgId = providedOrgId || await getCurrentOrgId(userId)

        if (!orgId) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 })
        }

        const transaction = await addSupplierTransaction(
            { supplier_id: supplierId, type, amount, note },
            orgId,
            userId
        )

        return NextResponse.json(transaction)
    } catch (e: any) {
        console.error("Add supplier tx error:", e)
        return NextResponse.json({ error: e.message || "Failed to record transaction" }, { status: 500 })
    }
}
