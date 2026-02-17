// ============================================================
// FILE 4: app/api/organizations/deletion/status/route.ts
// ============================================================

import { NextResponse } from "next/server"
import { getDeletionRequestStatus } from "@/lib/data/organizations"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const orgId = searchParams.get("orgId")
        if (!orgId) {
            return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
        }
        const status = await getDeletionRequestStatus(orgId)
        return NextResponse.json(status)
    } catch (error: any) {
        console.error("[DELETE/status]", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
