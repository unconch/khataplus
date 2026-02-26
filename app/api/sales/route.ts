import { NextRequest, NextResponse } from "next/server"
import { recordBatchSales } from "@/lib/data/sales"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { sales, orgId, idempotencyKey } = body
        const safeIdempotencyKey = typeof idempotencyKey === "string" ? idempotencyKey : undefined

        if (!sales || !Array.isArray(sales) || sales.length === 0) {
            return NextResponse.json({ error: "Invalid sales data" }, { status: 400 })
        }

        if (!orgId) {
            return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
        }

        // Reuse the server action logic
        // This handles auth, validation, DB insert, stock update, and revalidation
        const result = await recordBatchSales(sales, orgId, safeIdempotencyKey)

        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error("API Sales Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
