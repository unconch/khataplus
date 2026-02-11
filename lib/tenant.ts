import { headers } from "next/headers"
import { getOrganizationBySlug } from "./data/organizations"
import { Organization } from "./types"

/**
 * Resolves the current tenant from the request headers injected by middleware.
 */
export async function getTenant(): Promise<Organization | null> {
  const headersList = await headers()
  const slug = headersList.get("x-tenant-slug")

  if (!slug) {
    return null
  }

  return getOrganizationBySlug(slug)
}
