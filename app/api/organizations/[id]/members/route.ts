import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createInvite, getOrganizationMembers, updateMemberRole, removeMember, getOrganization } from "@/lib/data/organizations"

const getOriginFromRequest = (request: Request) => {
    const forwardedProto = request.headers.get("x-forwarded-proto")
    const forwardedHost = request.headers.get("x-forwarded-host")
    const host = request.headers.get("host")

    if (forwardedHost) {
        const proto = forwardedProto || "https"
        return `${proto}://${forwardedHost}`
    }
    if (host) {
        const proto = forwardedProto || "https"
        return `${proto}://${host}`
    }
    try {
        return new URL(request.url).origin
    } catch {
        return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }
}

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
        const { email, role } = await request.json().catch(() => ({}))

        const invite = await createInvite(orgId, email || null, role || "staff")
        const org = await getOrganization(orgId)

        // Generate invite link
        const origin = process.env.NEXT_PUBLIC_APP_URL || getOriginFromRequest(request)
        const inviteLink = `${origin}/auth/sign-up?invite=${invite.token}`

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
