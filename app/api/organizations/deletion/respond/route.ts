// ============================================================
// FILE 2: app/api/organizations/deletion/respond/route.ts
// ============================================================

import { NextResponse } from "next/server"
import { respondToOrganizationDeletion } from "@/lib/data/organizations"
import { StepUpRequiredError } from "@/lib/step-up"
import { getSession } from "@/lib/session-server"
import { getOrgContext } from "@/lib/server/org-context"
import { requireRole } from "@/lib/server/permissions"

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        try {
            const { role } = await getOrgContext()
            requireRole(role, ["owner"])
        } catch (err) {
            if (err instanceof Response) return err
            throw err
        }

        const body = await request.json().catch(() => null)
        if (!body?.requestId || typeof body?.approve !== "boolean") {
            return NextResponse.json({ error: "Missing requestId or approve" }, { status: 400 })
        }
        const result = await respondToOrganizationDeletion(body.requestId, body.approve)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("[DELETE/respond]", error.message)
        const status = error instanceof StepUpRequiredError ? 428
            : error.message.includes("not an approver") ? 403
            : error.message.includes("already responded") ? 409
            : error.message.includes("expired") ? 410
            : 500
        return NextResponse.json({ error: error.message }, { status })
    }
}
