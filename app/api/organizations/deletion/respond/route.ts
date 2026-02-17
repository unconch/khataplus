// ============================================================
// FILE 2: app/api/organizations/deletion/respond/route.ts
// ============================================================

import { NextResponse } from "next/server"
import { respondToOrganizationDeletion } from "@/lib/data/organizations"

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.requestId || typeof body?.approve !== "boolean") {
            return NextResponse.json({ error: "Missing requestId or approve" }, { status: 400 })
        }
        const result = await respondToOrganizationDeletion(body.requestId, body.approve)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[DELETE/respond]", error.message)
        const status = error.message.includes("not an approver") ? 403
            : error.message.includes("already responded") ? 409
            : error.message.includes("expired") ? 410
            : 500
        return NextResponse.json({ error: error.message }, { status })
    }
}
