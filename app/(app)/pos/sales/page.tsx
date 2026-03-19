import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { PosTerminal } from "@/components/pos/pos-terminal"
import type { InventoryItem } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function PosSalesPage() {
  const { getCurrentUser, getUserOrganizationsResolved } = await import("@/lib/data/auth")
  const { getSystemSettings } = await import("@/lib/data/organizations")
  const { getInventory } = await import("@/lib/data/inventory")
  const { getTenant } = await import("@/lib/tenant")

  const user = await getCurrentUser()
  const slug = (await headers()).get("x-tenant-slug")
  if (!user) {
    const nextPath = slug ? `/app/${slug}/pos/sales` : "/dashboard/sales"
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`)
  }

  const tenant = await getTenant()
  if (!tenant) {
    notFound()
  }

  const memberships = await getUserOrganizationsResolved(user.userId)
  const membership = memberships.find((row: any) => row?.org_id === tenant.id || row?.organization?.id === tenant.id)
  if (!membership) {
    redirect("/setup-organization")
  }

  const settings = await getSystemSettings(tenant.id)
  if (!settings.allow_staff_sales && membership.role === "staff") {
    redirect("/dashboard")
  }

  const inventory = await getInventory(tenant.id)
  const availableInventory = (inventory as InventoryItem[])
    .filter((item) => Number(item.stock || 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="h-full min-h-[calc(100svh-64px)]">
      <PosTerminal
        inventory={availableInventory}
        userId={user.userId || ""}
        orgId={tenant.id}
        org={tenant}
        gstEnabled={settings.gst_enabled}
        gstInclusive={settings.gst_inclusive}
      />
    </div>
  )
}

