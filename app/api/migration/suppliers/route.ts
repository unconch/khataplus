import { NextResponse } from "next/server"
import { importSuppliers } from "@/lib/data/migration"

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
        if (data.length === 0) {
            return NextResponse.json({ error: "No records provided for import" }, { status: 400 })
        }
        if (data.length > MAX_IMPORT_ROWS) {
            return NextResponse.json(
                { error: `Import too large: max ${MAX_IMPORT_ROWS} rows per request` },
                { status: 413 }
            )
        }

        console.log(`[API/Migration/Suppliers] Received ${data.length} items for org ${orgId}`)
        const results = await importSuppliers(orgId, data)

        return NextResponse.json(results, { status: 200 })
    } catch (error: any) {
        console.error("[API/Migration/Suppliers] Error:", error)
        return NextResponse.json(
            { error: error.message || "Import failed" },
            { status: 500 }
        )
    }
}
