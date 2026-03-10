import { headers } from "next/headers"

const ROLE_LEVEL = {
  owner: 4,
  admin: 3,
  manager: 2,
  staff: 1,
} as const

export type OrgRole = keyof typeof ROLE_LEVEL

function isOrgRole(value: string): value is OrgRole {
  return Object.prototype.hasOwnProperty.call(ROLE_LEVEL, value)
}

export async function getOrgContext() {
  const h = await headers()
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

export async function requireOrgContext() {
  const ctx = await getOrgContext()
  if (!ctx.orgId) {
    throw new Response("Tenant context required", { status: 400 })
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
