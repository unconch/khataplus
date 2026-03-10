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

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/home", { signal: controller.signal })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || "Failed to load dashboard data")
        if (!active) return
        setData(payload as DashboardHomePayload)
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
        hasCustomers: (data as any).customersCount ? (data as any).customersCount > 0 : true,
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
