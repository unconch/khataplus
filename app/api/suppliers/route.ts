import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { addSupplier } from "@/lib/data/suppliers"
import { getCurrentOrgId } from "@/lib/data/auth"

export async function POST(request: Request) {
    try {
        const sessionRes = await getSession()
        const userId = sessionRes?.userId

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name, phone, address, gstin, orgId: providedOrgId } = await request.json()

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const orgId = providedOrgId || await getCurrentOrgId(userId)

        if (!orgId) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 })
        }

        const supplier = await addSupplier({ name, phone, address, gstin }, orgId)

        return NextResponse.json(supplier)
    } catch (e: any) {
        console.error("Add supplier error:", e)
        return NextResponse.json({ error: e.message || "Failed to add supplier" }, { status: 500 })
    }
}
