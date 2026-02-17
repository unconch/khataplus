import { NextResponse } from "next/server"
import { importExpenses } from "@/lib/data/migration"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orgId, data } = body

        if (!orgId || !data || !Array.isArray(data)) {
            return NextResponse.json(
                { error: "Invalid request: orgId and data array required" },
                { status: 400 }
            )
        }

        console.log(`[API/Migration/Expenses] Received ${data.length} items for org ${orgId}`)
        const results = await importExpenses(orgId, data)

        return NextResponse.json(results, { status: 200 })
    } catch (error: any) {
        console.error("[API/Migration/Expenses] Error:", error)
        return NextResponse.json(
            { error: error.message || "Import failed" },
            { status: 500 }
        )
    }
}
