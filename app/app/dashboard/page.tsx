import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { buildAuthContext, getCurrentUser } from "@/lib/data/auth"

export default async function DashboardFallback() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login?next=%2Fapp%2Fdashboard")
  }
  if (user.isGuest) {
    redirect("/app/demo/dashboard")
  }

  const cookieStore = await cookies()
  const hintedSlug = String(cookieStore.get("kp_org_slug")?.value || "").trim()
  const slug = hintedSlug || String((await buildAuthContext()).orgSlug || "").trim()

  if (slug) {
    redirect(`/app/${slug}/dashboard`)
  }
  redirect("/onboarding")
}
