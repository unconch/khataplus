import { NextResponse } from "next/server"

export const revalidate = 300

export async function GET() {
    try {
        const { getProductionSql } = await import("@/lib/db")
        const db = getProductionSql()

        const tableExists = await db`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'system_announcements'
            ) as exists
        ` as any[]

        if (!tableExists?.[0]?.exists) {
            return NextResponse.json({ announcement: null }, {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
                },
            })
        }

        const announcements = await db`
            SELECT message, type
            FROM system_announcements
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        ` as any[]

        return NextResponse.json(
            { announcement: announcements?.[0] ?? null },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
                },
            }
        )
    } catch {
        return NextResponse.json({ announcement: null }, { status: 200 })
    }
}
