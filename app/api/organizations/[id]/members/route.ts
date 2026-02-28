import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createInvite, getOrganizationMembers, updateMemberRole, removeMember, getOrganization } from "@/lib/data/organizations"

const normalizeOrigin = (value?: string | null): string | null => {
    if (!value) return null

    const trimmed = value.split(",")[0]?.trim()
    if (!trimmed) return null

    try {
        const origin = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).origin
        const host = new URL(origin).hostname

        // Never emit localhost invite links in production.
        if (process.env.NODE_ENV === "production" && (host === "localhost" || host === "127.0.0.1")) {
            return null
        }

        return origin
    } catch {
        return null
    }
}

const getOriginFromRequest = (request: Request): string | null => {
    const forwardedProto = request.headers.get("x-forwarded-proto")
    const forwardedHost = request.headers.get("x-forwarded-host")
    const host = request.headers.get("host")

    if (forwardedHost) {
        const proto = forwardedProto || "https"
        return normalizeOrigin(`${proto}://${forwardedHost}`)
    }
    if (host) {
        const proto = forwardedProto || "https"
        return normalizeOrigin(`${proto}://${host}`)
    }

    return normalizeOrigin(request.url)
}

const resolvePublicOrigin = (request: Request): string => {
    return (
        getOriginFromRequest(request) ||
        normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
        normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
        normalizeOrigin(process.env.VERCEL_URL) ||
        "https://khataplus.online"
    )
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
        const origin = resolvePublicOrigin(request)
        const inviteLink = `${origin}/auth/sign-up?invite=${invite.token}`

        return NextResponse.json({
            ...invite,
            link: inviteLink,
            orgName: org?.name
        })
    } catch (e: any) {
        const message = String(e?.message || "Failed to create invite")
        const isLimitError = /seat limit|seat capacity|limit reached|upgrade/i.test(message)
        return NextResponse.json({ error: message }, { status: isLimitError ? 409 : 500 })
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
