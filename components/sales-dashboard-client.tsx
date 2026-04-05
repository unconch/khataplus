"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Receipt,
} from "lucide-react"
import { SalesForm } from "@/components/sales-form"
import { GstBills } from "@/components/gst-bills"
import { Button } from "@/components/ui/button"
import type { Sale, InventoryItem, SystemSettings, DailyReport } from "@/lib/types"

interface SalesDashboardClientProps {
  allSales: Sale[]
  inventory: InventoryItem[]
  reports: DailyReport[]
  settings: SystemSettings
  org: { name: string; gstin?: string; upi_id?: string; plan_type?: string }
  userId: string
  orgId: string
  autoOpen: boolean
}

export function SalesDashboardClient({
  allSales,
  inventory,
  settings,
  org,
  userId,
  orgId,
  autoOpen,
}: SalesDashboardClientProps) {
  const [showBillArchive, setShowBillArchive] = useState(false)

  useEffect(() => {
    if (!autoOpen) return
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById("sales-terminal")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [autoOpen])

  const todayStr = new Date().toISOString().split("T")[0]

  const todaySales = useMemo(
    () => allSales.filter((s) => (s.sale_date || "").toString().split("T")[0] === todayStr),
    [allSales, todayStr]
  )

  return (
    <div className="min-h-full space-y-6 pb-6 bg-background/50">
      <div className="flex flex-col md:flex-row md:items-center justify-start gap-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 border rounded-xl px-3 h-10 bg-card">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {todaySales.length} today
            </span>
          </div>

          {settings.gst_enabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBillArchive((v) => !v)}
              className="h-10 rounded-xl border-zinc-300/70 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-white/10 dark:bg-[rgba(30,41,59,0.72)] dark:text-zinc-100 dark:hover:bg-[rgba(51,65,85,0.86)]"
            >
              <Receipt className="mr-2 h-4 w-4" />
              {showBillArchive ? "Sales Terminal" : "Bill Archive"}
            </Button>
          )}

        </div>
      </div>

      {settings.gst_enabled && showBillArchive ? (
        <section className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white/70 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-[rgba(30,41,59,0.52)]">
          <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-2.5 dark:border-white/8 dark:bg-[rgba(15,23,42,0.52)] sm:px-6">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">Bill Archive</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">Invoice history and records</p>
          </div>
          <div className="p-4 sm:p-6">
            <GstBills sales={allSales as Sale[]} org={org} />
          </div>
        </section>
      ) : (
        <section id="sales-terminal" className="overflow-visible">
          <SalesForm
            inventory={inventory}
            userId={userId}
            gstInclusive={settings.gst_inclusive}
            gstEnabled={settings.gst_enabled}
            showBuyPrice={Boolean(settings.show_buy_price_in_sales)}
            orgId={orgId}
            org={org}
          />
        </section>
      )}
    </div>
  )
}
