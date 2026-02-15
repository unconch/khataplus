import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createInvite, getOrganizationMembers, updateMemberRole, removeMember, getOrganization } from "@/lib/data/organizations"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: orgId } = await params
        const members = await getOrganizationMembers(orgId)

        return NextResponse.json(members)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: orgId } = await params
        const { email, role } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const invite = await createInvite(orgId, email, role || "staff")
        const org = await getOrganization(orgId)

        // Generate invite link
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invite.token}`

        return NextResponse.json({
            ...invite,
            link: inviteLink,
            orgName: org?.name
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: orgId } = await params
        const { memberId, role } = await request.json()

        await updateMemberRole(orgId, memberId, role)

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: orgId } = await params
        const { memberId } = await request.json()

        if (memberId === userId) {
            return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
        }

        await removeMember(orgId, memberId)

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
