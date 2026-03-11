import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProductionSql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawName = searchParams.get("name") || ""
    const name = rawName.trim().replace(/\s+/g, " ")

    if (name.length < 3) {
      return NextResponse.json({ available: false, reason: "too_short" })
    }

    const sql = getProductionSql()
    const rows = await sql`
      SELECT id
      FROM organizations
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `

    return NextResponse.json({
      available: rows.length === 0,
      normalizedName: name,
    })
  } catch (error: any) {
    console.error("Name availability check failed:", error)
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 })
  }
}

