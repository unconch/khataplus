import { getProfile, getSystemSettings } from "@/lib/data"
import { session } from "@descope/nextjs-sdk/server"
import { redirect } from "next/navigation"
import { HomeDashboard } from "@/components/home-dashboard"

export default async function DashboardPage() {
  const currSession = await session()
  const userId = (currSession as any)?.token?.sub || (currSession as any)?.user?.userId

  if (!userId) {
    redirect("/")
  }

  const profile = await getProfile(userId)
  const settings = await getSystemSettings(profile?.organization_id || "")

  if (!profile) {
    redirect("/")
  }

  const orgId = profile.organization_id || ""

  // Fetch stats for onboarding guide
  const [inventory, customers, sales, org] = await Promise.all([
    import("@/lib/data").then(m => m.getInventory(orgId)),
    import("@/lib/data").then(m => m.getCustomers(orgId)),
    import("@/lib/data").then(m => m.getSales(orgId)),
    import("@/lib/data").then(m => m.getOrganization(orgId))
  ])

  const onboardingStats = {
    hasInventory: inventory.length > 0,
    hasCustomers: customers.length > 0,
    hasSales: sales.length > 0,
    isProfileComplete: !!(org?.gstin && org?.address)
  }

  return <HomeDashboard profile={profile} settings={settings} onboardingStats={onboardingStats} />
}
