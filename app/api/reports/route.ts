import { NextRequest, NextResponse } from "next/server"
import { getDailyReports } from "@/lib/data/reports"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const orgId = searchParams.get("orgId")
        const range = searchParams.get("range") || "month"

        if (!orgId) {
            return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
        }

        const reports = await getDailyReports(orgId, range)
        return NextResponse.json({ reports })
    } catch (error: any) {
        console.error("API Reports Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
