
import { getProfile } from "@/lib/data/profiles"
import { getSystemSettings } from "@/lib/data/organizations"
import { redirect } from "next/navigation"
import { HomeDashboard } from "@/components/home-dashboard"

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { getCurrentUser } = await import("@/lib/data/auth")
  const { getProfile } = await import("@/lib/data/profiles")
  const { getSystemSettings, getOrganization, getUserOrganizations } = await import("@/lib/data/organizations")
  const { getInventory } = await import("@/lib/data/inventory")
  const { getCustomers } = await import("@/lib/data/customers")
  const { getSales } = await import("@/lib/data/sales")
  const { getDailyReports } = await import("@/lib/data/reports")
  const { getLowStockItems } = await import("@/lib/data/inventory")

  const user = await getCurrentUser()

  if (!user) {
    console.log("--- [DEBUG] DashboardPage: No User -> Redirecting to Login ---")
    redirect("/auth/login")
    return null
  }
  const { userId, isGuest } = user

  // If user hits /dashboard without an org slug in the path, redirect to /{slug}/dashboard
  const { headers } = await import("next/headers")
  const headerList = await headers()
  const tenantSlug = headerList.get("x-tenant-slug")

  if (!tenantSlug && !isGuest) {
    const userOrgs = await getUserOrganizations(userId)
    if (userOrgs.length > 0) {
      const slug = userOrgs[0].organization.slug
      console.log(`--- [DEBUG] DashboardPage: No org in path, redirecting to /${slug}/dashboard ---`)
      redirect(`/${slug}/dashboard`)
    } else {
      redirect("/setup-organization")
    }
  }

  if (isGuest) {
    console.log("--- [DEBUG] Guest Mode Detected in Dashboard ---")
  }

  let profile;
  if (isGuest) {
    profile = {
      id: "guest-user",
      name: "Guest User",
      email: "guest@khataplus.demo",
      role: "admin",
      status: "approved",
      organization_id: "demo-org",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      biometric_required: false
    } as any;
  } else {
    profile = await getProfile(userId)
  }

  if (!profile) {
    redirect("/auth/login")
    return null
  }

  const settings = await getSystemSettings(profile.organization_id || "")

  const orgId = profile.organization_id || ""

  // Fetch stats for onboarding guide
  const [inventory, customers, sales, org, reports, lowStockItems] = await Promise.all([
    getInventory(orgId),
    getCustomers(orgId),
    getSales(orgId),
    getOrganization(orgId),
    getDailyReports(orgId),
    getLowStockItems(orgId)
  ])

  const onboardingStats = {
    hasInventory: inventory.length > 0,
    hasCustomers: customers.length > 0,
    hasSales: sales.length > 0,
    isProfileComplete: !!(org?.gstin && org?.address)
  }

  // Calculate real metrics
  const unpaidAmount = customers.reduce((acc, c: any) => acc + ((c.balance || 0) > 0 ? (c.balance || 0) : 0), 0)

  // Simple inventory health: % of items in stock
  const totalItems = inventory.length
  // Cast to any to access quantity safely without importing type if checking strictness
  const inStockItems = inventory.filter((i: any) => (i.stock || i.quantity || 0) > 5).length
  const inventoryHealth = totalItems > 0 ? Math.round((inStockItems / totalItems) * 100) : 100

  return (
    <HomeDashboard
      profile={profile}
      settings={settings}
      onboardingStats={onboardingStats}
      reports={reports}
      unpaidAmount={unpaidAmount}
      inventoryHealth={inventoryHealth}
      lowStockItems={lowStockItems}
    />
  )
}
