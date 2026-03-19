// ============================================================
// FILE 3: app/api/organizations/deletion/cancel/route.ts
// ============================================================

import { NextResponse } from "next/server"
import { cancelOrganizationDeletion } from "@/lib/data/organizations"

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.orgId) {
            return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
        }
        await cancelOrganizationDeletion(body.orgId)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("[DELETE/cancel]", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
