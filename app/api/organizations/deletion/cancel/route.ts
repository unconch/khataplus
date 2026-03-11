// ============================================================
// FILE 3: app/api/organizations/deletion/cancel/route.ts
// ============================================================

import { NextResponse } from "next/server"
import { cancelOrganizationDeletion } from "@/lib/data/organizations"
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
