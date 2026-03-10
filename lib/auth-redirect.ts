import "server-only"
import { sql } from "@/lib/db"

export function getAppHostFromHostname(hostname: string): string {
  if (!hostname) return "app.khataplus.online"
  if (hostname === "localhost" || hostname === "127.0.0.1") return hostname
  if (hostname.endsWith(".localhost")) return hostname

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

function isSetupOrganizationPath(pathname: string): boolean {
  return pathname === "/setup-organization" || pathname.startsWith("/setup-organization/")
}

async function getPrimaryOrganizationSlug(userId: string): Promise<string> {
  if (!userId) return ""
  try {
    const rows = await sql`
      SELECT o.slug
      FROM organization_members om
      JOIN organizations o ON o.id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY om.created_at ASC
      LIMIT 1
    `
    return String(rows?.[0]?.slug || "").trim()
  } catch {
    return ""
  }
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

  const slug = await getPrimaryOrganizationSlug(userId)
  if (!slug) return `${pathname}${parsed.search}${parsed.hash}`
  return `/${slug}${pathname}${parsed.search}${parsed.hash}`
}

export async function resolvePostAuthPath(userId: string, nextPath: string): Promise<string> {
  if (!userId || !nextPath.startsWith("/")) return nextPath

  let parsed: URL
  try {
    parsed = new URL(nextPath, "http://local")
  } catch {
    return nextPath
  }

  const pathname = parsed.pathname || "/dashboard"
  if (isDashboardPath(pathname)) {
    return resolveSlugDashboardPath(userId, nextPath)
  }

  if (isSetupOrganizationPath(pathname)) {
    const slug = await getPrimaryOrganizationSlug(userId)
    if (slug) return `/${slug}/dashboard`
  }

  return `${pathname}${parsed.search}${parsed.hash}`
}

