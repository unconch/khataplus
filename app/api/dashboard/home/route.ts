import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { getCurrentUser, isGuestMode } = await import("@/lib/data/auth")
    const currentUser = await getCurrentUser()
    const userId = currentUser?.userId

    if (!userId || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { getProfile, ensureProfile } = await import("@/lib/data/profiles")
    const { getUserOrganizationsResolved } = await import("@/lib/data/auth")
    const { getSystemSettings, getOrganization, getOrganizationBySlug } = await import("@/lib/data/organizations")
    const { getInventoryStats } = await import("@/lib/data/inventory")
    const { getDailyReports } = await import("@/lib/data/reports")
    const { getDashboardOverview } = await import("@/lib/data/dashboard")

    const isGuest = currentUser.isGuest || (await isGuestMode())
    let profile = isGuest
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

    if (!profile && !isGuest) {
      profile = await ensureProfile(userId, currentUser.email)
    }

    let orgId = profile?.organization_id || ""
    if (!isGuest && !orgId) {
      const orgs = await getUserOrganizationsResolved(userId)
      if (orgs.length > 0) {
        orgId = orgs[0].org_id
      }
    } else if (isGuest && !orgId) {
      orgId = "demo-org"
    }

    if (!profile) {
      profile = {
        id: userId,
        name: currentUser.email?.split("@")[0] || "User",
        email: currentUser.email,
        role: "owner",
        status: "approved",
        organization_id: orgId || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        biometric_required: false,
      } as any
    }

    let orgOverride: any = null
    const { headers } = await import("next/headers")
    const headersList = await headers()
    const tenantSlug = headersList.get("x-tenant-slug")
    if (tenantSlug) {
      const orgBySlug = await getOrganizationBySlug(tenantSlug)
      if (orgBySlug) {
        orgOverride = orgBySlug
        orgId = orgBySlug.id
        if (!profile.organization_id) {
          profile = { ...profile, organization_id: orgId }
        }
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 404 })
    }

    const settings = await getSystemSettings(orgId)
    const [inventoryStats, orgRaw, reports, overview] = await Promise.all([
      getInventoryStats(orgId),
      orgOverride ? Promise.resolve(orgOverride) : getOrganization(orgId),
      getDailyReports(orgId),
      getDashboardOverview(orgId),
    ])
    const org = orgRaw || (isGuest ? ({
      id: "demo-org",
      name: "KhataPlus Demo Shop",
      slug: "demo",
      created_by: "system",
      created_at: new Date().toISOString(),
    } as any) : ({
      id: orgId,
      name: "KhataPlus Org",
      slug: "org",
      created_by: profile.id,
      created_at: new Date().toISOString(),
    } as any))

    return NextResponse.json(
      {
        profile,
        org,
        settings,
        reports: Array.isArray(reports) ? reports : [],
        unpaidAmount: overview.unpaidAmount,
        toPayAmount: overview.payableAmount,
        inventoryHealth: inventoryStats.health,
        lowStockCount: inventoryStats.lowStockCount,
        sales: Array.isArray(overview?.recentSales) ? overview.recentSales : [],
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
