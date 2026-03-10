import { OrgRole } from "./org-context"

export function requireRole(role: OrgRole | null, allowed: OrgRole[]) {
  if (!role || !allowed.includes(role)) {
    throw new Response("Forbidden", { status: 403 })
  }
}

export function hasRole(role: OrgRole | null, allowed: OrgRole[]) {
  return role !== null && allowed.includes(role)
}
