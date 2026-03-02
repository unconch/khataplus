import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { Loader2, ScanLine, Store } from "lucide-react"
import type { InventoryItem } from "@/lib/types"
import { SalesFormPos } from "@/components/sales-form-pos"

export const dynamic = "force-dynamic"

export default async function DedicatedPosSalesPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params

  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-100">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <DedicatedPosSalesContent slug={slug} />
    </Suspense>
  )
}

async function DedicatedPosSalesContent({ slug }: { slug: string }) {
  const { getCurrentUser, getUserOrganizationsResolved } = await import("@/lib/data/auth")
  const { getOrganizationBySlug, getSystemSettings } = await import("@/lib/data/organizations")
  const { getInventory } = await import("@/lib/data/inventory")

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/${slug}/sales`)}`)
    return null
  }

  const org = await getOrganizationBySlug(slug)
  if (!org) {
    notFound()
  }

  const orgs = await getUserOrganizationsResolved(user.userId)
  const membership = orgs.find((row: any) => row?.organization?.id === org.id || row?.org_id === org.id)
  if (!membership) {
    redirect("/setup-organization")
    return null
  }

  const settings = await getSystemSettings(org.id)
  if (!settings.allow_staff_sales && membership.role === "staff") {
    redirect(`/${slug}/dashboard`)
    return null
  }

  const inventory = await getInventory(org.id)
  const availableInventory = (inventory as InventoryItem[])
    .filter((item) => item.stock > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-sm">
              <ScanLine className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">POS</p>
              <h1 className="text-sm sm:text-base font-black tracking-tight">{org.name}</h1>
            </div>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5">
            <Store className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              {availableInventory.length} active SKUs
            </span>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <SalesFormPos
            inventory={availableInventory}
            userId={user.userId || ""}
            gstInclusive={settings.gst_inclusive}
            gstEnabled={settings.gst_enabled}
            showBuyPrice={Boolean(settings.show_buy_price_in_sales)}
            orgId={org.id}
            org={{ name: org.name || "KhataPlus", gstin: (org as any)?.gstin, upi_id: org?.upi_id }}
          />
        </div>
      </section>
    </main>
  )
}
