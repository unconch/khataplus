import "server-only"
import { sql } from "@/lib/db"

function isCanonicalSlugDashboardPath(pathname: string): boolean {
  return /^\/[^/]+\/dashboard(?:\/|$)/.test(pathname)
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/")
}

export async function resolveSlugDashboardPath(userId: string, nextPath: string): Promise<string> {
  if (!userId || !nextPath.startsWith("/")) return nextPath

  let parsed: URL
  try {
    parsed = new URL(nextPath, "http://local")
  } catch {
    return nextPath
  }

  const pathname = parsed.pathname || "/dashboard"
  if (!isDashboardPath(pathname) || isCanonicalSlugDashboardPath(pathname)) {
    return `${pathname}${parsed.search}${parsed.hash}`
  }

  try {
    const rows = await sql`
      SELECT o.slug
      FROM organization_members om
      JOIN organizations o ON o.id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY om.created_at ASC
      LIMIT 1
    `
    const slug = String(rows?.[0]?.slug || "").trim()
    if (!slug) return `${pathname}${parsed.search}${parsed.hash}`
    return `/${slug}${pathname}${parsed.search}${parsed.hash}`
  } catch {
    return `${pathname}${parsed.search}${parsed.hash}`
  }
}

