import { NextResponse } from "next/server"
import { session } from "@descope/nextjs-sdk/server"
import { getInviteByToken, acceptInvite, getOrganization } from "@/lib/data/organizations"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        const invite = await getInviteByToken(token)

        if (!invite) {
            return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 })
        }

        const org = await getOrganization(invite.org_id)

        return NextResponse.json({
            email: invite.email,
            role: invite.role,
            orgName: org?.name
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const sessionRes = await session()
        const userId = sessionRes?.token?.sub

        if (!userId) {
            return NextResponse.json({ error: "Please login first" }, { status: 401 })
        }

        const { token } = await params
        const invite = await getInviteByToken(token)

        if (!invite) {
            return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 })
        }

        const success = await acceptInvite(token, userId)

        if (!success) {
            return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 })
        }

        const org = await getOrganization(invite.org_id)

        return NextResponse.json({
            success: true,
            orgName: org?.name
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
