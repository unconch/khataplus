import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { addKhataTransaction, deleteKhataTransaction, updateKhataTransaction } from "@/lib/data/customers"
import { getCurrentOrgId } from "@/lib/data/auth"

export async function POST(request: Request) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { customerId, type, amount, note, sale_id, orgId: providedOrgId } = await request.json()
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

        const orgId = providedOrgId || await getCurrentOrgId(userId)

        if (!orgId) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 })
        }

        const transaction = await addKhataTransaction(
            { customer_id: customerId, type, amount: numericAmount, note, sale_id },
            orgId
        )

        return NextResponse.json(transaction)
    } catch (e: any) {
        console.error("Add khata tx error:", e)
        return NextResponse.json({ error: e.message || "Failed to record transaction" }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { txId, amount, note, type, orgId: providedOrgId } = await request.json()
        if (!txId) {
            return NextResponse.json({ error: "Missing txId" }, { status: 400 })
        }

        const orgId = providedOrgId || await getCurrentOrgId(userId)
        if (!orgId) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 })
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

        const transaction = await updateKhataTransaction(txId, updates, orgId)
        return NextResponse.json(transaction)
    } catch (e: any) {
        console.error("Update khata tx error:", e)
        return NextResponse.json({ error: e.message || "Failed to update transaction" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const txId = searchParams.get("txId")
        const providedOrgId = searchParams.get("orgId")

        if (!txId) {
            return NextResponse.json({ error: "Missing txId" }, { status: 400 })
        }

        const orgId = providedOrgId || await getCurrentOrgId(userId)
        if (!orgId) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 })
        }

        await deleteKhataTransaction(txId, orgId)
        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("Delete khata tx error:", e)
        return NextResponse.json({ error: e.message || "Failed to delete transaction" }, { status: 500 })
    }
}
