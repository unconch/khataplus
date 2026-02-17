import { NextRequest, NextResponse } from "next/server"
import { getExpenses } from "@/lib/data/expenses"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const orgId = searchParams.get("orgId")
        const range = searchParams.get("range") || "month"
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        if (!orgId) {
            return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
        }

        // Handle range presets
        let start = startDate
        let end = endDate

        if (!start && range) {
            const now = new Date()
            if (range === "today") {
                start = new Date(now.setHours(0, 0, 0, 0)).toISOString()
            } else if (range === "week") {
                start = new Date(now.setDate(now.getDate() - 7)).toISOString()
            } else if (range === "month") {
                start = new Date(now.setDate(now.getDate() - 30)).toISOString()
            }
        }

        const expenses = await getExpenses(orgId, start || undefined, end || undefined)
        return NextResponse.json({ expenses })
    } catch (error: any) {
        console.error("API Expenses Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
