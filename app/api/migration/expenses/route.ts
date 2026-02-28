import { NextResponse } from "next/server"
import { importExpenses } from "@/lib/data/migration"
import { requirePlanFeature, PlanFeatureError } from "@/lib/plan-feature-guard"

const MAX_IMPORT_ROWS = 10000

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orgId, data } = body

        if (!orgId || !Array.isArray(data)) {
            return NextResponse.json(
                { error: "Invalid request: orgId and data array required" },
                { status: 400 }
            )
        }
        await requirePlanFeature(orgId, "migration_import")
        if (data.length === 0) {
            return NextResponse.json({ error: "No records provided for import" }, { status: 400 })
        }
        if (data.length > MAX_IMPORT_ROWS) {
            return NextResponse.json(
                { error: `Import too large: max ${MAX_IMPORT_ROWS} rows per request` },
                { status: 413 }
            )
        }

        console.log(`[API/Migration/Expenses] Received ${data.length} items for org ${orgId}`)
        const results = await importExpenses(orgId, data)

        return NextResponse.json(results, { status: 200 })
    } catch (error: any) {
        if (error instanceof PlanFeatureError) {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
        }
        console.error("[API/Migration/Expenses] Error:", error)
        return NextResponse.json(
            { error: error.message || "Import failed" },
            { status: 500 }
        )
    }
}
