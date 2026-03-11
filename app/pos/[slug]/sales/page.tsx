import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import type { InventoryItem } from "@/lib/types"
import { PosTerminal } from "@/components/pos-terminal"

export const dynamic = "force-dynamic"

export default async function DedicatedPosSalesPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[9999] w-full flex flex-col items-center justify-center bg-zinc-950 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Initializing Secure Terminal</p>
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
    redirect(`/auth/login?next=${encodeURIComponent(`/${slug}/pos/sales`)}`)
    return null
  }

  const org = await getOrganizationBySlug(slug)
  if (!org) {
    notFound()
  }

  const orgs = await getUserOrganizationsResolved(user.userId)
  const membership = orgs.find((row: any) => row?.organization?.id === org.id || row?.org_id === org.id)
  if (!membership) {
    redirect("/onboarding")
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
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950">
      <PosTerminal
        inventory={availableInventory}
        userId={user.userId || ""}
        orgId={org.id}
        org={org}
        gstEnabled={settings.gst_enabled}
        gstInclusive={settings.gst_inclusive}
      />
    </div>
  )
}

