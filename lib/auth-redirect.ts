import { getUserOrganizations } from "@/lib/data/organizations"

export async function resolveSlugDashboardPath(userId: string, nextPath = "/dashboard"): Promise<string> {
  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("/auth/")
      ? nextPath
      : "/dashboard"

  try {
    const orgs = await getUserOrganizations(userId)
    const slug = orgs?.[0]?.organization?.slug
    if (!slug) return "/setup-organization"
    return `/${slug}${safeNext}`
  } catch {
    return "/setup-organization"
  }
}

