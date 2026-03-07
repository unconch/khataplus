import "server-only"
import { sql } from "@/lib/db"

export function getAppHostFromHostname(hostname: string): string {
  if (!hostname) return "app.khataplus.online"
  if (hostname === "localhost" || hostname === "127.0.0.1") return "app.localhost"
  if (hostname.endsWith(".localhost")) return "app.localhost"

  let base = hostname.toLowerCase()
  if (base.startsWith("www.")) base = base.slice(4)
  if (base.startsWith("demo.")) base = base.slice(5)
  if (base.startsWith("pos.")) base = base.slice(4)
  if (base.startsWith("app.")) base = base.slice(4)

  return `app.${base}`
}

export function toAppOriginFromRequestUrl(requestUrl: URL): string {
  const appHost = getAppHostFromHostname(requestUrl.hostname)
  const port = requestUrl.port ? `:${requestUrl.port}` : ""
  return `${requestUrl.protocol}//${appHost}${port}`
}

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

