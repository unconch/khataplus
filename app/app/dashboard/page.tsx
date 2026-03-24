import { redirect } from "next/navigation"

import { getCurrentUser, getUserOrganizationsResolved } from "@/lib/data/auth"

export default async function DashboardFallback() {
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
