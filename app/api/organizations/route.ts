import { NextResponse } from "next/server"
import { session } from "@descope/nextjs-sdk/server"
import { createOrganization, getUserOrganizations } from "@/lib/data/organizations"
import { getProfile, upsertProfile } from "@/lib/data/profiles"

export async function POST(request: Request) {
    try {
        const sessionRes = await session()
        const userId = sessionRes?.token?.sub

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name, userName, gstin, address, phone } = await request.json()

        // If userName is provided, update the user's profile
        if (userName && typeof userName === "string" && userName.trim().length >= 2) {
            const profile = await getProfile(userId);
            if (profile) {
                await upsertProfile({
                    ...profile,
                    name: userName.trim()
                });
            }
        }

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json({ error: "Business name must be at least 2 characters" }, { status: 400 })
        }

        const org = await createOrganization(name.trim(), userId, {
            gstin: gstin?.trim() || null,
            address: address?.trim() || null,
            phone: phone?.trim() || null
        })

        return NextResponse.json(org)
    } catch (e: any) {
        console.error("Create org error:", e)
        return NextResponse.json({ error: e.message || "Failed to create organization" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const sessionRes = await session()
        const userId = sessionRes?.token?.sub

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const orgs = await getUserOrganizations(userId)

        return NextResponse.json(orgs)
    } catch (e: any) {
        console.error("Get orgs error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
