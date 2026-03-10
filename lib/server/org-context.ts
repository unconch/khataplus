import { headers } from "next/headers"

const validRoles = ["owner", "admin", "manager", "staff"] as const
export type OrgRole = typeof validRoles[number]
const ROLE_LEVEL: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  staff: 1,
}

function isOrgRole(value: string): value is OrgRole {
  return validRoles.includes(value as OrgRole)
}

export function getOrgContext() {
  const h = headers()
  const rawRole = h.get("x-org-role")
  const role: OrgRole | null =
    rawRole && isOrgRole(rawRole)
      ? rawRole
      : null

  return {
    orgId: h.get("x-org-id"),
    role,
    slug: h.get("x-tenant-slug"),
  }
}

export function requireOrgContext() {
  const ctx = getOrgContext()
  if (!ctx.orgId) {
    throw new Response("Missing org context", { status: 400 })
  }
  return ctx
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
