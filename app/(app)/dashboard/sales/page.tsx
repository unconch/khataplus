import type { InventoryItem, Sale } from "@/lib/types"
import { NewSaleDialog } from "@/components/new-sale-dialog"
import { RecentSales } from "@/components/recent-sales"
import { GstBills } from "@/components/gst-bills"
import { getInventory } from "@/lib/data/inventory"
import { getSales } from "@/lib/data/sales"
import { getSystemSettings, getOrganization } from "@/lib/data/organizations"
import { getCurrentOrgId } from "@/lib/data/auth"
import { ShoppingCart, Receipt } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

export default async function SalesPage(props: { searchParams: Promise<{ action?: string }> }) {
  const searchParams = await props.searchParams
  const shouldOpenNewSale = searchParams?.action === "new"

  return (
    <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up stagger-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sales Register</h2>
          <p className="text-sm text-muted-foreground">Unified transaction and invoice management</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="h-[500px] w-full flex items-center justify-center bg-muted/20 rounded-xl animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      }>
        <SalesContent autoOpen={shouldOpenNewSale} />
      </Suspense>
    </div>
  )
}

async function SalesContent({ autoOpen }: { autoOpen: boolean }) {
  const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
  const { getInventory } = await import("@/lib/data/inventory")
  const { getSales } = await import("@/lib/data/sales")
  const { getSystemSettings, getOrganization } = await import("@/lib/data/organizations")
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
    return null
  }
  const { userId, isGuest } = user

  let orgId: string | null = null
  if (isGuest) {
    orgId = "demo-org"
  } else {
    orgId = await getCurrentOrgId(userId)
  }

  if (!orgId) {
    redirect("/setup-organization")
    return null
  }

  const [inventory, allSales, settings, org] = await Promise.all([
    getInventory(orgId),
    getSales(orgId),
    getSystemSettings(orgId),
    getOrganization(orgId)
  ])

  // Filter for available stock for the form
  const availableInventory = inventory.filter(item => item.stock > 0).sort((a, b) => a.name.localeCompare(b.name))

  // Filter for Today and Yesterday
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Reset time part to ensure full coverage
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)

  const recentTransactions = allSales.filter(sale => {
    const saleDate = new Date(sale.created_at)
    saleDate.setHours(0, 0, 0, 0) // Compare dates only
    return saleDate.getTime() === today.getTime() || saleDate.getTime() === yesterday.getTime()
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <>
      <div className="flex justify-end animate-slide-up stagger-2">
        <NewSaleDialog
          inventory={(availableInventory as InventoryItem[]) || []}
          userId={userId}
          gstInclusive={settings.gst_inclusive}
          gstEnabled={settings.gst_enabled}
          defaultOpen={autoOpen}
          orgId={orgId}
          org={{ name: org?.name || "KhataPlus", gstin: (org as any)?.gstin }}
        />
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1.5 bg-muted/30 shadow-sm">
          <TabsTrigger value="feed" className="gap-2 font-bold uppercase tracking-widest text-[10px]">
            <ShoppingCart className="h-4 w-4" />
            Live Feed
          </TabsTrigger>
          {settings.gst_enabled && (
            <TabsTrigger value="bills" className="gap-2 font-bold uppercase tracking-widest text-[10px]">
              <Receipt className="h-4 w-4" />
              Invoice History
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="feed" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              Last 48 Hours
            </span>
          </div>
          <RecentSales sales={(recentTransactions as Sale[]) || []} userId={userId || ""} />
        </TabsContent>

        {settings.gst_enabled && (
          <TabsContent value="bills" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <GstBills
              sales={(allSales as Sale[]) || []}
              org={{ name: org?.name || "KhataPlus", gstin: (org as any)?.gstin }}
            />
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}
