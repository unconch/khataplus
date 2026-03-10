import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const sessionRes = await getSession()
    const userId = sessionRes?.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { getProfile, ensureProfile } = await import("@/lib/data/profiles")
    const { getUserOrganizationsResolved, getCurrentUser } = await import("@/lib/data/auth")
    const { getSystemSettings, getOrganization } = await import("@/lib/data/organizations")
    const { getInventoryStats } = await import("@/lib/data/inventory")
    const { getDailyReports } = await import("@/lib/data/reports")
    const { getDashboardOverview } = await import("@/lib/data/dashboard")

    const user = await getCurrentUser()
    let profile = user?.isGuest
      ? ({
          id: "guest-user",
          name: "Guest User",
          email: "guest@khataplus.demo",
          role: "admin",
          status: "approved",
          organization_id: "demo-org",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          biometric_required: false,
        } as any)
      : await getProfile(userId)

    if (!profile && user) {
      profile = await ensureProfile(userId, (user as any).email)
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 401 })
    }

    let orgId = profile.organization_id || ""
    if (!user?.isGuest && !orgId) {
      const orgs = await getUserOrganizationsResolved(userId)
      if (orgs.length === 0) {
        return NextResponse.json({ error: "No organization" }, { status: 404 })
      }
      orgId = orgs[0].org_id
    }

    const settings = await getSystemSettings(orgId)
    const [inventoryStats, org, reports, overview] = await Promise.all([
      getInventoryStats(orgId),
      getOrganization(orgId),
      getDailyReports(orgId),
      getDashboardOverview(orgId),
    ])

    return NextResponse.json(
      {
        profile,
        org,
        settings,
        reports,
        unpaidAmount: overview.unpaidAmount,
        toPayAmount: overview.payableAmount,
        inventoryHealth: inventoryStats.health,
        lowStockCount: inventoryStats.lowStockCount,
        sales: overview.recentSales,
        inventoryCount: inventoryStats.totalCount,
        customersCount: overview.customersCount,
        salesCount: overview.salesCount,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  } catch (error: any) {
    console.error("[dashboard/home] failed:", error)
    return NextResponse.json({ error: error?.message || "Failed to load dashboard" }, { status: 500 })
  }
}
