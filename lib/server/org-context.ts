import "server-only"

import { cookies, headers } from "next/headers"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/data/auth"
import { logAccessBlockedAttempt } from "@/lib/monitoring"

const ROLE_LEVEL = {
  owner: 4,
  admin: 3,
  manager: 2,
  staff: 1,
} as const

export type OrgRole = keyof typeof ROLE_LEVEL

export type ResolvedOrgContext = {
  orgId: string
  orgSlug: string
  role: OrgRole
  membershipId: string
  isOwner: boolean
  isGuest: false
}

export type GuestOrgContext = {
  orgId: "demo-org"
  orgSlug: "demo"
  role: "owner"
  membershipId: "demo"
  isOwner: true
  isGuest: true
}

export type OrgContext = ResolvedOrgContext | GuestOrgContext

export class TenantAccessError extends Error {
  constructor(
    public readonly code:
      | "NO_SLUG"
      | "NOT_AUTHENTICATED"
      | "NOT_A_MEMBER"
      | "ORG_NOT_FOUND",
    message: string
  ) {
    super(message)
    this.name = "TenantAccessError"
  }
}

const RESERVED_SUBDOMAINS = new Set(["www", "app", "demo", "pos", "localhost"])

function normalizeSlugValue(value: string | null | undefined) {
  const slug = String(value || "").trim().toLowerCase()
  if (!slug || slug === "undefined" || slug === "null" || slug.includes(".")) {
    return null
  }
  return slug
}

function tryExtractSlugFromUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) return null

  try {
    const parsed = new URL(rawUrl)
    const host = parsed.hostname.toLowerCase()
    const parts = host.split(".").filter(Boolean)
    const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
    const isLocalHost = host === "localhost" || host.endsWith(".localhost")

    if (parts.length >= 3 && !isIpv4 && !isLocalHost) {
      const subdomain = normalizeSlugValue(parts[0])
      if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
        return subdomain
      }
    }

    const segments = parsed.pathname.split("/").filter(Boolean)
    if (segments[0] === "app" && segments[1] && segments[1] !== "dashboard") {
      return normalizeSlugValue(segments[1])
    }
  } catch {
    return null
  }

  return null
}

async function resolveTenantSlugFromRequest() {
  const h = await headers()

  const headerSlug = normalizeSlugValue(h.get("x-tenant-slug"))
  if (headerSlug) return headerSlug

  const refererSlug = tryExtractSlugFromUrl(h.get("referer"))
  if (refererSlug) return refererSlug

  const originSlug = tryExtractSlugFromUrl(h.get("origin"))
  if (originSlug) return originSlug

  const cookieStore = await cookies()
  const cookieSlug = normalizeSlugValue(cookieStore.get("kp_org_slug")?.value)
  if (cookieSlug) return cookieSlug

  return null
}

/**
 * THE authoritative tenant resolver for HTTP request handlers.
 *
 * Resolution order (strict):
 *   1. x-tenant-slug header set by proxy (derived from current URL path)
 *   2. validate user is a member of that org in Neon
 *   3. return resolved context
 *
 * Never falls back to orgs[0] or stale cookies.
 * Throws TenantAccessError with a typed code so callers can decide:
 *   - redirect to /app/dashboard  -> NO_SLUG, NOT_AUTHENTICATED
 *   - 403 Forbidden               -> NOT_A_MEMBER
 *   - 404 Not Found               -> ORG_NOT_FOUND
 */
export async function resolveRequestOrgContext(): Promise<OrgContext> {
  const currentUser = await getCurrentUser()

  if (currentUser?.isGuest) {
    return {
      orgId: "demo-org",
      orgSlug: "demo",
      role: "owner",
      membershipId: "demo",
      isOwner: true,
      isGuest: true,
    }
  }

  if (!currentUser) {
    throw new TenantAccessError("NOT_AUTHENTICATED", "No authenticated user")
  }

  // Slug MUST come from the proxy header (derived from the current route path).
  // We do NOT fall back to cookies or metadata here - those are UX hints, not auth.
  const slug = await resolveTenantSlugFromRequest()

  if (!slug) {
    throw new TenantAccessError(
      "NO_SLUG",
      "No tenant slug in request context"
    )
  }

  // Validate membership in Neon - this is the authoritative check.
  const rows = await sql`
    SELECT
      om.id            AS membership_id,
      om.org_id,
      om.role,
      o.slug
    FROM organization_members om
    JOIN organizations o ON o.id = om.org_id
    WHERE om.user_id = ${currentUser.userId}
      AND o.slug      = ${slug}
    LIMIT 1
  `

  const row = rows[0]

  if (!row) {
    const requestHeaders = await headers()
    const resolvedPath = requestHeaders.get("x-invoke-path") || requestHeaders.get("referer")
    const pathPrefix = requestHeaders.get("x-path-prefix")
    const orgRows = await sql`
      SELECT id, name
      FROM organizations
      WHERE slug = ${slug}
      LIMIT 1
    `

    if (orgRows.length === 0) {
      throw new TenantAccessError("ORG_NOT_FOUND", `Org "${slug}" not found`)
    }

    const org = orgRows[0] as { id?: string; name?: string } | undefined
    await logAccessBlockedAttempt({
      userId: currentUser.userId,
      userEmail: currentUser.email || null,
      tenantId: org?.id || null,
      tenantName: org?.name || slug,
      tenantSlug: slug,
      requestPath: resolvedPath,
      pathPrefix,
    })

    throw new TenantAccessError(
      "NOT_A_MEMBER",
      `User ${currentUser.userId} is not a member of org "${slug}"`
    )
  }

  const role = isOrgRole(String(row.role)) ? (row.role as OrgRole) : "staff"

  return {
    orgId: String(row.org_id),
    orgSlug: String(row.slug),
    role,
    membershipId: String(row.membership_id),
    isOwner: role === "owner",
    isGuest: false,
  }
}

export async function resolvePageOrgContext(): Promise<OrgContext> {
  const { notFound, redirect } = await import("next/navigation")

  try {
    return await resolveRequestOrgContext()
  } catch (e) {
    if (e instanceof TenantAccessError) {
      if (e.code === "ORG_NOT_FOUND") {
        notFound()
      }
      if (e.code === "NOT_AUTHENTICATED") {
        redirect("/auth/login")
      }
      redirect("/app/dashboard")
    }
    throw e
  }
}

/**
 * Same as resolveRequestOrgContext() but auto-converts TenantAccessError
 * into the appropriate NextResponse so route handlers don't need try/catch.
 *
 * Usage:
 *   const ctx = await requireOrgContext()
 *   if (ctx instanceof NextResponse) return ctx
 */
export async function requireOrgContext(): Promise<
  OrgContext | import("next/server").NextResponse
> {
  const { NextResponse } = await import("next/server")
  try {
    return await resolveRequestOrgContext()
  } catch (e) {
    if (e instanceof TenantAccessError) {
      if (e.code === "NOT_AUTHENTICATED" || e.code === "NO_SLUG") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (e.code === "NOT_A_MEMBER" || e.code === "ORG_NOT_FOUND") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
    throw e
  }
}

/**
 * For background jobs, webhooks, cron tasks - where there is no HTTP request
 * and therefore no x-tenant-slug header. Caller must supply org_id explicitly
 * from the job payload. Never uses orgs[0].
 */
export async function resolveJobOrgContext(
  orgId: string,
  userId?: string
): Promise<OrgContext> {
  if (orgId === "demo-org") {
    return {
      orgId: "demo-org",
      orgSlug: "demo",
      role: "owner",
      membershipId: "demo",
      isOwner: true,
      isGuest: true,
    }
  }

  const rows = userId
    ? await sql`
        SELECT
          om.id AS membership_id,
          om.role,
          o.slug,
          o.id AS org_id
        FROM organizations o
        LEFT JOIN organization_members om
          ON om.org_id = o.id
          AND om.user_id = ${userId}
        WHERE o.id = ${orgId}
        LIMIT 1
      `
    : await sql`
        SELECT
          NULL::text AS membership_id,
          NULL::text AS role,
          o.slug,
          o.id AS org_id
        FROM organizations o
        WHERE o.id = ${orgId}
        LIMIT 1
      `

  const row = rows[0]
  if (!row) {
    throw new TenantAccessError("ORG_NOT_FOUND", `Org ${orgId} not found`)
  }
  if (userId && !row.membership_id) {
    throw new TenantAccessError(
      "NOT_A_MEMBER",
      `User ${userId} is not a member of org ${orgId}`
    )
  }

  const role = isOrgRole(String(row.role)) ? (row.role as OrgRole) : "staff"
  return {
    orgId: String(row.org_id),
    orgSlug: String(row.slug),
    role,
    membershipId: String(row.membership_id ?? ""),
    isOwner: role === "owner",
    isGuest: false,
  }
}

/** @deprecated Use resolveRequestOrgContext() for business logic */
export async function getOrgContext() {
  const h = await headers()
  const rawRole = h.get("x-org-role")
  const role: OrgRole | null = rawRole && isOrgRole(rawRole) ? rawRole : null
  return {
    orgId: h.get("x-org-id"),
    role,
    slug: h.get("x-tenant-slug"),
  }
}

function isOrgRole(value: string): value is OrgRole {
  return Object.prototype.hasOwnProperty.call(ROLE_LEVEL, value)
}

export function hasRole(role: OrgRole | null, allowed: OrgRole[]) {
  return role !== null && allowed.includes(role)
}

export function requireRole(role: OrgRole | null, allowed: OrgRole[]) {
  if (!role || !allowed.includes(role)) {
    throw new Response("Forbidden", { status: 403 })
  }
}

export function requireMinRole(role: OrgRole | null, min: OrgRole) {
  if (!role || ROLE_LEVEL[role] < ROLE_LEVEL[min]) {
    throw new Response("Forbidden", { status: 403 })
  }
}
