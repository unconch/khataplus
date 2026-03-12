import { NextRequest, NextResponse } from "next/server"
import { isReserved, isValidSlug } from "@/lib/system-routes"
import { getProductionSql } from "@/lib/db"
import { rateLimit, getIP } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
    const ip = getIP(req.headers)

    // Rate limit: 60 req/min/IP
    await rateLimit(`availability:${ip}`, 60, 60000)

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")

    if (!slug) {
        return NextResponse.json({ available: false }, { status: 400 })
    }

    // 1. Format/Reserved check
    if (!isValidSlug(slug) || isReserved(slug)) {
        return NextResponse.json({ available: false })
    }

    // 2. DB check
    try {
        const sql = getProductionSql()
        const result = await sql`
      SELECT 1 FROM organizations WHERE slug = ${slug.toLowerCase()} LIMIT 1
    `
        return NextResponse.json({ available: result.length === 0 })
    } catch (error) {
        console.error("Slug availability check failed:", error)
        return NextResponse.json({ available: false }, { status: 500 })
    }
}
