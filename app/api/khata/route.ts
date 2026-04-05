import { NextResponse } from "next/server"
import { addKhataTransaction, deleteKhataTransaction, updateKhataTransaction } from "@/lib/data/customers"
import { requireOrgContext } from "@/lib/server/org-context"

export async function POST(request: Request) {
    try {
        const ctx = await requireOrgContext()
        if (ctx instanceof NextResponse) return ctx

        const { customerId, type, amount, note, sale_id } = await request.json()
        const numericAmount = Number(amount)

        if (!customerId || !type || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }
        if (type !== "credit" && type !== "payment") {
            return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
        }
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
        }

        const transaction = await addKhataTransaction(
            { customer_id: customerId, type, amount: numericAmount, note, sale_id },
            ctx.orgId
        )

        return NextResponse.json(transaction)
    } catch (e: any) {
        console.error("Add khata tx error:", e)
        return NextResponse.json({ error: e.message || "Failed to record transaction" }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const ctx = await requireOrgContext()
        if (ctx instanceof NextResponse) return ctx

        const { txId, amount, note, type } = await request.json()
        if (!txId) {
            return NextResponse.json({ error: "Missing txId" }, { status: 400 })
        }

        const updates: { amount?: number; note?: string; type?: "credit" | "payment" } = {}
        if (amount !== undefined) {
            const numericAmount = Number(amount)
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
            }
            updates.amount = numericAmount
        }
        if (note !== undefined) {
            updates.note = String(note || "")
        }
        if (type !== undefined) {
            if (type !== "credit" && type !== "payment") {
                return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
            }
            updates.type = type
        }

        const transaction = await updateKhataTransaction(txId, updates, ctx.orgId)
        return NextResponse.json(transaction)
    } catch (e: any) {
        console.error("Update khata tx error:", e)
        return NextResponse.json({ error: e.message || "Failed to update transaction" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const ctx = await requireOrgContext()
        if (ctx instanceof NextResponse) return ctx

        const { searchParams } = new URL(request.url)
        const txId = searchParams.get("txId")

        if (!txId) {
            return NextResponse.json({ error: "Missing txId" }, { status: 400 })
        }

        await deleteKhataTransaction(txId, ctx.orgId)
        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("Delete khata tx error:", e)
        return NextResponse.json({ error: e.message || "Failed to delete transaction" }, { status: 500 })
    }
}
