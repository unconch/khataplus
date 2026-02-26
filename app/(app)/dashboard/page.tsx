import { redirect } from "next/navigation"
import { HomeDashboard } from "@/components/home-dashboard"

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { getCurrentUser, getUserOrganizationsResolved } = await import("@/lib/data/auth")
  const { getProfile } = await import("@/lib/data/profiles")
  const { getSystemSettings, getOrganization } = await import("@/lib/data/organizations")
  const { getInventoryStats } = await import("@/lib/data/inventory")
  const { getDailyReports } = await import("@/lib/data/reports")
  const { getDemoSql, getProductionSql } = await import("@/lib/db")

  const user = await getCurrentUser()

  if (!user) {
    console.log("--- [DEBUG] DashboardPage: No User -> Redirecting to Login ---")
    redirect("/auth/login")
    return null
  }
  const { userId, isGuest } = user

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
    const { ensureProfile } = await import("@/lib/data/profiles")
    profile = await ensureProfile(userId, (user as any).email)
  }

  if (!profile) {
    redirect("/auth/login")
    return null
  }

  let orgId = profile.organization_id || ""

  // Resolve org from memberships if profile org_id is missing
  if (!isGuest && !orgId) {
    const orgs = await getUserOrganizationsResolved(userId)
    if (orgs.length === 0) {
      redirect("/setup-organization")
      return null
    }
    orgId = orgs[0].org_id
  }

  const settings = await getSystemSettings(orgId)

  // Keep /dashboard as canonical to avoid slug rewrite loops.

  // Fetch stats for onboarding guide
  const db = isGuest ? getDemoSql() : getProductionSql()

  const [
    inventoryStats,
    org,
    reports,
    customersCountResult,
    salesCountResult,
    recentSalesRaw,
    unpaidResult,
    payableResult
  ] = await Promise.all([
    getInventoryStats(orgId),
    getOrganization(orgId),
    getDailyReports(orgId),
    db`SELECT COUNT(*)::int as count FROM customers WHERE org_id = ${orgId}`,
    db`SELECT COUNT(*)::int as count FROM sales WHERE org_id = ${orgId}`,
    db`
      SELECT id, customer_name, quantity, sale_date, total_amount
      FROM sales
      WHERE org_id = ${orgId}
      ORDER BY created_at DESC
      LIMIT 5
    `,
    db`
      SELECT COALESCE(SUM(balance), 0)::numeric as unpaid
      FROM (
        SELECT COALESCE(SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END), 0) as balance
        FROM customers c
        LEFT JOIN khata_transactions k ON c.id = k.customer_id
        WHERE c.org_id = ${orgId}
        GROUP BY c.id
      ) t
      WHERE t.balance > 0
    `,
    db`
      SELECT COALESCE(SUM(balance), 0)::numeric as payable
      FROM (
        SELECT COALESCE(SUM(CASE WHEN st.type = 'purchase' THEN st.amount ELSE -st.amount END), 0) as balance
        FROM suppliers s
        LEFT JOIN supplier_transactions st ON s.id = st.supplier_id
        WHERE s.org_id = ${orgId}
        GROUP BY s.id
      ) t
      WHERE t.balance > 0
    `
  ])

  const sales = recentSalesRaw.map((row: any) => ({
    ...row,
    quantity: Number(row.quantity || 0),
    total_amount: Number(row.total_amount || 0),
    sale_date: row.sale_date,
  }))

  const onboardingStats = {
    hasInventory: inventoryStats.totalCount > 0,
    hasCustomers: Number(customersCountResult?.[0]?.count || 0) > 0,
    hasSales: Number(salesCountResult?.[0]?.count || 0) > 0,
    isProfileComplete: !!(org?.gstin && org?.address)
  }

  const unpaidAmount = Number(unpaidResult?.[0]?.unpaid || 0)
  const toPayAmount = Number(payableResult?.[0]?.payable || 0)
  const inventoryHealth = inventoryStats.health

  return (
    <HomeDashboard
      profile={profile}
      org={org as any}
      settings={settings}
      onboardingStats={onboardingStats}
      reports={reports}
      unpaidAmount={unpaidAmount}
      toPayAmount={toPayAmount}
      inventoryHealth={inventoryHealth}
      lowStockCount={inventoryStats.lowStockCount}
      sales={sales as any}
      inventoryCount={inventoryStats.totalCount}
    />
  )
}
