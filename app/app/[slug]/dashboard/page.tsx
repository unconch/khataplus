import { redirect } from "next/navigation"

export default async function AppDashboardResolverPage({ params }: { params: { slug: string } }) {
  const { getCurrentUser, getUserOrganizationsResolved } = await import("@/lib/data/auth")

  const user = await getCurrentUser()
  if (!user || user.isGuest) {
    redirect("/auth/login?next=%2Fapp%2Fdashboard")
  }

  const orgs = await getUserOrganizationsResolved(user.userId)
  const slug = String(orgs?.[0]?.organization?.slug || "").trim()

  if (slug) {
    redirect(`/app/${slug}/dashboard`)
  }

  redirect("/onboarding")
}
