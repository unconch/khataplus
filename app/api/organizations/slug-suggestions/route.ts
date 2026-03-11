import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProductionSql } from "@/lib/db"

function normalizeSlug(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
}

function buildCandidates(base: string): string[] {
    const root = base || "organization"
    return [
        root,
        `${root}-store`,
        `${root}-shop`,
        `${root}-business`,
        `${root}-${new Date().getFullYear()}`,
        `${root}-${Math.floor(100 + Math.random() * 900)}`,
        `${root}-${Math.floor(1000 + Math.random() * 9000)}`,
    ].map(normalizeSlug).filter(Boolean)
}

export async function GET(request: Request) {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const name = searchParams.get("name") || ""
        const slug = searchParams.get("slug") || ""
        const currentOrgId = searchParams.get("currentOrgId") || ""
        const limitParam = Number(searchParams.get("limit") || "5")
        const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 10) : 5

        const base = normalizeSlug(slug || name) || "organization"
        let candidates = Array.from(new Set([base, ...buildCandidates(base)]))

        // Robustly exclude the current slug from candidates so we don't suggest staying on the same one
        const currentOrgSlugRows = currentOrgId ? await getProductionSql()`SELECT slug FROM organizations WHERE id = ${currentOrgId}` : []
        const currentOrgSlug = currentOrgSlugRows[0]?.slug as string | undefined
        if (currentOrgSlug) {
            candidates = candidates.filter(c => c !== currentOrgSlug)
        }

        const sql = getProductionSql()
        const existingRows = await sql`
            SELECT slug FROM organizations
            WHERE slug = ANY(${candidates})
            AND (${currentOrgId || null}::text IS NULL OR id <> ${currentOrgId || null})
        `
        const existing = new Set(existingRows.map((r: any) => String(r.slug)))
        const isBaseAvailable = base === currentOrgSlug || !existing.has(base)
        let available = candidates.filter((s) => !existing.has(s) && s !== currentOrgSlug)

        let seed = 1
        while (available.length < limit && seed < 50) {
            const extra = normalizeSlug(`${base}-${seed}`)
            if (extra && !existing.has(extra) && !available.includes(extra)) {
                available.push(extra)
            }
            seed++
        }

        return NextResponse.json({
            base,
            available: isBaseAvailable,
            suggestions: available.filter((s) => s !== base).slice(0, limit),
        })
    } catch (error: any) {
        console.error("Slug suggestion error:", error)
        return NextResponse.json({ error: error.message || "Failed to suggest slugs" }, { status: 500 })
    }
}
