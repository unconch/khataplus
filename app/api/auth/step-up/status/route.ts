import { NextResponse } from "next/server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { assertRecentOtpStepUp, getOrgDeletionStepUpFlowId, StepUpRequiredError } from "@/lib/step-up"

export async function GET(request: Request) {
    try {
        const session = await getSession()
        const flowId = getOrgDeletionStepUpFlowId()

        if (!session?.userId) {
            return NextResponse.json({ verified: false, flowId, reason: "no_session" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const requestId = searchParams.get("requestId")

        let minimumAuthTimeSeconds: number | undefined

        if (requestId) {
            const rows = await sql`
                SELECT odr.created_at
                FROM org_deletion_requests odr
                JOIN org_deletion_approvals oda ON oda.request_id = odr.id
                WHERE odr.id = ${requestId}
                  AND oda.owner_id = ${session.userId}
                  AND odr.status = 'pending'
                LIMIT 1
            `

            if (rows.length === 0) {
                return NextResponse.json(
                    { verified: false, flowId, reason: "not_approver" },
                    { status: 403 }
                )
            }

            minimumAuthTimeSeconds = Math.floor(new Date(rows[0].created_at).getTime() / 1000)
        }

        await assertRecentOtpStepUp({ minimumAuthTimeSeconds })
        return NextResponse.json({ verified: true, flowId })
    } catch (error: any) {
        if (error instanceof StepUpRequiredError) {
            return NextResponse.json(
                { verified: false, flowId: getOrgDeletionStepUpFlowId(), reason: "step_up_required", message: error.message },
                { status: 200 }
            )
        }

        console.error("[STEP-UP/status]", error.message)
        return NextResponse.json({ error: "Failed to check step-up status" }, { status: 500 })
    }
}

