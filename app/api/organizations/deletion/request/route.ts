// ============================================================
// FILE 1: app/api/organizations/deletion/request/route.ts
// ============================================================

import { NextResponse } from "next/server"
import { requestOrganizationDeletion } from "@/lib/data/organizations"
import { StepUpRequiredError } from "@/lib/step-up"

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null)
        if (!body?.orgId) {
            return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
        }
        const result = await requestOrganizationDeletion(body.orgId)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[DELETE/request]", error.message)
        const status = error instanceof StepUpRequiredError ? 428
            : error.message.includes("Only the original creator") ? 403
                : 500
        return NextResponse.json({ error: error.message }, { status })
    }
}
