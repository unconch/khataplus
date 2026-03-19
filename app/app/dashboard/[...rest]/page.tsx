import { redirect } from "next/navigation"

export default async function AppDashboardResolverCatchAllPage(
  props: { params: Promise<{ rest?: string[] }> }
) {
  const { rest = [] } = await props.params
  const suffix = rest.length > 0 ? `/${rest.join("/")}` : ""

  const { getCurrentUser, getUserOrganizationsResolved } = await import("@/lib/data/auth")

  const user = await getCurrentUser()
  if (!user || user.isGuest) {
    redirect(`/auth/login?next=${encodeURIComponent(`/app/dashboard${suffix}`)}`)
  }

  const orgs = await getUserOrganizationsResolved(user.userId)
  const slug = String(orgs?.[0]?.organization?.slug || "").trim()

  if (slug) {
    redirect(`/app/${slug}/dashboard${suffix}`)
  }

  redirect("/onboarding")
}
