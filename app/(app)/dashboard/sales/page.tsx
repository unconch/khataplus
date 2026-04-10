import type { InventoryItem, Sale } from "@/lib/types"
import { SalesDashboardClient } from "@/components/sales-dashboard-client"
import { Suspense } from "react"
import { SalesPageSkeleton } from "@/components/skeletons"
import { redirect } from "next/navigation"
import { resolvePageOrgContext } from "@/lib/server/org-context"

export default async function SalesPage(props: { searchParams: Promise<{ action?: string }> }) {
  const searchParams = await props.searchParams
  const shouldOpenNewSale = searchParams?.action === "new"

  return (
    <div className="min-h-full space-y-10 pb-20 bg-background/50">
      <Suspense fallback={<SalesPageSkeleton />}>
        <SalesPageContent autoOpen={shouldOpenNewSale} />
      </Suspense>
    </div>
  )
}

async function SalesPageContent({ autoOpen }: { autoOpen: boolean }) {
  const { getCurrentUser } = await import("@/lib/data/auth")
  const { getSales } = await import("@/lib/data/sales")
  const { getInventory } = await import("@/lib/data/inventory")
  const { getSystemSettings, getOrganization } = await import("@/lib/data/organizations")
  const { getDailyReports } = await import("@/lib/data/reports")

  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
    return null
  }

  const { userId } = user
  const { orgId } = await resolvePageOrgContext()

  const [allSales, inventory, settings, org, reports] = await Promise.all([
    getSales(orgId, { limit: 1000 }),
    getInventory(orgId),
    getSystemSettings(orgId),
    getOrganization(orgId),
    getDailyReports(orgId),
  ])

  const availableInventory = (inventory as InventoryItem[])
    .filter((item) => item.stock > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <SalesDashboardClient
      allSales={allSales as Sale[]}
      inventory={availableInventory}
      reports={reports}
      settings={settings}
      org={{ name: org?.name || "KhataPlus", gstin: (org as any)?.gstin, upi_id: org?.upi_id, plan_type: org?.plan_type }}
      orgId={orgId}
      userId={userId || ""}
      autoOpen={autoOpen}
    />
  )
}
