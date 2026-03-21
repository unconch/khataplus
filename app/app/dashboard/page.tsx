import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/data/auth"

export default async function DashboardFallback() {
  const user = await getCurrentUser()
  const slug = (user as any)?.activeOrgSlug
  if (slug) redirect(`/app/${slug}/dashboard`)
  redirect("/auth/login")
}
