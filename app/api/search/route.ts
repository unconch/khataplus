import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireOrgContext } from "@/lib/server/org-context"

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireOrgContext()
    if (ctx instanceof NextResponse) return ctx

    const { searchParams } = request.nextUrl
    const query = searchParams.get("q")?.trim()
    if (!query || query.length < 2) return NextResponse.json({ results: [] })

    const { orgId } = ctx
    const sql = neon(process.env.DATABASE_URL!)
    const searchPattern = `%${query}%`

    const customers = await sql`
      SELECT id, name, phone
      FROM customers
      WHERE org_id = ${orgId}
        AND (name ILIKE ${searchPattern} OR phone ILIKE ${searchPattern})
      LIMIT 5
    `

    const sales = await sql`
      SELECT DISTINCT s.batch_id, s.sale_date, s.total_amount, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.org_id = ${orgId}
        AND s.batch_id IS NOT NULL
        AND (s.batch_id ILIKE ${searchPattern} OR c.name ILIKE ${searchPattern})
      ORDER BY s.sale_date DESC
      LIMIT 5
    `

    const results = [
      ...customers.map((c: any) => ({
        type: "customer" as const,
        id: c.id,
        title: c.name,
        subtitle: c.phone || "No phone",
        href: `/dashboard/khata/${c.id}`,
      })),
      ...sales.map((s: any) => ({
        type: "sale" as const,
        id: s.batch_id,
        title: s.customer_name || `Bill #${s.batch_id.slice(0, 8)}`,
        subtitle: `\u20B9${s.total_amount} - ${new Date(s.sale_date).toLocaleDateString("en-IN")}`,
        href: `/dashboard/sales?batch=${s.batch_id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
