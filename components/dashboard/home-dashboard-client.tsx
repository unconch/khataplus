"use client"

import { useEffect, useState } from "react"
import { HomeDashboard } from "@/components/home-dashboard"

type DashboardHomePayload = {
  profile: any
  org: any
  settings: any
  reports: any[]
  unpaidAmount: number
  toPayAmount: number
  inventoryHealth: number
  lowStockCount: number
  sales: any[]
  inventoryCount: number
  customersCount?: number
  salesCount?: number
}

function DashboardSkeleton() {
  return (
    <div className="min-h-full space-y-6 md:space-y-10 pb-20">
      <div className="h-10 md:h-14 w-3/5 bg-muted/40 rounded-2xl animate-pulse" />
      <div className="h-12 md:h-14 w-full bg-muted/30 rounded-2xl animate-pulse" />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 h-[320px] md:h-[420px] rounded-3xl bg-muted/30 animate-pulse" />
        <div className="lg:col-span-4 h-[320px] md:h-[420px] rounded-3xl bg-muted/30 animate-pulse" />
      </div>
      <div className="grid gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 md:h-28 rounded-3xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export function HomeDashboardClient() {
  const [data, setData] = useState<DashboardHomePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const nowIso = () => new Date().toISOString()
  const normalizePayload = (payload: Partial<DashboardHomePayload>): DashboardHomePayload => ({
    profile: payload.profile ?? {
      id: "unknown",
      name: "User",
      email: "",
      role: "owner",
      status: "approved",
      created_at: nowIso(),
      updated_at: nowIso(),
      biometric_required: false,
    },
    org: payload.org ?? {
      id: "unknown",
      name: "Organization",
      slug: "org",
      created_by: "system",
      created_at: nowIso(),
      updated_at: nowIso(),
      plan_type: "free",
      subscription_status: "active",
    },
    settings: payload.settings ?? {
      id: "default",
      allow_staff_inventory: true,
      allow_staff_sales: true,
      allow_staff_reports: true,
      allow_staff_reports_entry_only: false,
      allow_staff_analytics: false,
      allow_staff_add_inventory: false,
      gst_enabled: true,
      gst_inclusive: false,
      show_buy_price_in_sales: false,
      updated_at: nowIso(),
    },
    reports: Array.isArray(payload.reports) ? payload.reports : [],
    unpaidAmount: Number(payload.unpaidAmount ?? 0),
    toPayAmount: Number(payload.toPayAmount ?? 0),
    inventoryHealth: Number(payload.inventoryHealth ?? 0),
    lowStockCount: Number(payload.lowStockCount ?? 0),
    sales: Array.isArray(payload.sales) ? payload.sales : [],
    inventoryCount: Number(payload.inventoryCount ?? 0),
    customersCount: typeof payload.customersCount === "number" ? payload.customersCount : undefined,
    salesCount: typeof payload.salesCount === "number" ? payload.salesCount : undefined,
  })

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/home", { signal: controller.signal })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
          const detail = payload?.error ? `: ${payload.error}` : ""
          throw new Error(`Failed to load dashboard data (${res.status})${detail}`)
        }
        if (!active) return
        const normalized = normalizePayload(payload as Partial<DashboardHomePayload>)
        setData(normalized)
      } catch (err: any) {
        if (!active || err?.name === "AbortError") return
        setError(err?.message || "Failed to load dashboard data")
      }
    }

    void load()
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center text-center gap-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="h-10 px-4 rounded-xl bg-zinc-950 text-white text-sm font-bold"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />

  return (
    <HomeDashboard
      profile={data.profile}
      org={data.org}
      settings={data.settings}
      onboardingStats={{
        hasInventory: data.inventoryCount > 0,
        hasCustomers: typeof data.customersCount === "number" ? data.customersCount > 0 : true,
        hasSales: data.sales.length > 0,
        isProfileComplete: !!(data.org?.gstin && data.org?.address),
      }}
      reports={data.reports}
      unpaidAmount={data.unpaidAmount}
      toPayAmount={data.toPayAmount}
      inventoryHealth={data.inventoryHealth}
      lowStockCount={data.lowStockCount}
      sales={data.sales}
      inventoryCount={data.inventoryCount}
    />
  )
}
