import { NextResponse } from "next/server"
import { session } from "@descope/nextjs-sdk/server"
import { addCustomer } from "@/lib/data/customers"
import { getCurrentOrgId } from "@/lib/data/auth"

export async function POST(request: Request) {
    try {
        const sessionRes = await session()
        const userId = sessionRes?.token?.sub

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name, phone, address, orgId: providedOrgId } = await request.json()

        if (!name || !phone) {
            return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
        }

        // Verify user belongs to org if orgId is provided, otherwise get their primary org
        const orgId = providedOrgId || await getCurrentOrgId(userId)

        if (!orgId) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 })
        }

        const customer = await addCustomer({ name, phone, address }, orgId)

        return NextResponse.json(customer)
    } catch (e: any) {
        console.error("Add customer error:", e)
        return NextResponse.json({ error: e.message || "Failed to add customer" }, { status: 500 })
    }
}
