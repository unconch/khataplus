import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { ensureProfile } from "@/lib/data/profiles"

export async function POST(request: Request) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId
        const sessionEmail = sessionRes?.email || (userId ? `descope_${userId}@local.invalid` : undefined)

        if (!userId || !sessionEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json().catch(() => ({} as any))
        const referrerCode = typeof body?.referrerCode === "string" ? body.referrerCode : undefined
        const name = typeof body?.name === "string" ? body.name : undefined
        const phone = typeof body?.phone === "string" ? body.phone : undefined

        const profile = await ensureProfile(userId, sessionEmail, name, phone, referrerCode)
        return NextResponse.json(profile)
    } catch (e: any) {
        console.error("Ensure profile error:", e)
        return NextResponse.json({ error: e?.message || "Failed to ensure profile" }, { status: 500 })
    }
}
