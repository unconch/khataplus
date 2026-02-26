import type { InventoryItem, Sale } from "@/lib/types"
import { SalesDashboardClient } from "@/components/sales-dashboard-client"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

export default async function SalesPage(props: { searchParams: Promise<{ action?: string }> }) {
  const searchParams = await props.searchParams
  const shouldOpenNewSale = searchParams?.action === "new"

  return (
    <div className="min-h-full space-y-10 pb-20 bg-background/50">
      <Suspense fallback={
        <div className="h-[600px] w-full flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        </div>
      }>
        <SalesPageContent autoOpen={shouldOpenNewSale} />
      </Suspense>
    </div>
  )
}

async function SalesPageContent({ autoOpen }: { autoOpen: boolean }) {
  const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
  const { getSales } = await import("@/lib/data/sales")
  const { getInventory } = await import("@/lib/data/inventory")
  const { getSystemSettings, getOrganization } = await import("@/lib/data/organizations")
  const { getDailyReports } = await import("@/lib/data/reports")

  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
    return null
  }

  const { userId, isGuest } = user
  const orgId = isGuest ? "demo-org" : await getCurrentOrgId(userId)
  if (!orgId) return null

  const [allSales, inventory, settings, org, reports] = await Promise.all([
    getSales(orgId, { limit: 300 }),
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
      org={{ name: org?.name || "KhataPlus", gstin: (org as any)?.gstin, upi_id: org?.upi_id }}
      orgId={orgId}
      userId={userId || ""}
      autoOpen={autoOpen}
    />
  )
}
