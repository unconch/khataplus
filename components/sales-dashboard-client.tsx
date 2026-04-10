"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  FileClock,
  History,
  Plus,
  Search,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react"
import { SalesForm } from "@/components/sales-form"
import { GstBills } from "@/components/gst-bills"
import { RecentSales } from "@/components/recent-sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { DailyReport, InventoryItem, Sale, SystemSettings } from "@/lib/types"

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
  const [activeView, setActiveView] = useState<"terminal" | "today" | "history">("today")
  const [historyQuery, setHistoryQuery] = useState("")

  useEffect(() => {
    if (!autoOpen) return
    setActiveView("terminal")
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById("sales-terminal")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [autoOpen])

  const getDateKey = (value: string | Date | null | undefined) => {
    if (!value) return ""
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ""

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  const todayStr = getDateKey(new Date())

  const todaySales = useMemo(
    () => allSales.filter((sale) => getDateKey(sale.sale_date as any) === todayStr),
    [allSales, todayStr]
  )

  const pastSales = useMemo(
    () => allSales.filter((sale) => getDateKey(sale.sale_date as any) !== todayStr),
    [allSales, todayStr]
  )

  const filteredPastSales = useMemo(() => {
    const query = historyQuery.trim().toLowerCase()
    if (!query) return pastSales

    return pastSales.filter((sale) => {
      const values = [
        sale.inventory?.name || "",
        sale.customer_name || "",
        sale.payment_method || "",
        Number(sale.total_amount || 0).toString(),
        new Date(sale.sale_date).toLocaleDateString("en-IN"),
      ]
      return values.some((value) => value.toLowerCase().includes(query))
    })
  }, [historyQuery, pastSales])

  const todayValue = useMemo(
    () => todaySales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0),
    [todaySales]
  )

  const pastValue = useMemo(
    () => pastSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0),
    [pastSales]
  )

  const settledPastCount = useMemo(
    () => pastSales.filter((sale) => sale.payment_status !== "pending").length,
    [pastSales]
  )

  const pendingPastCount = pastSales.length - settledPastCount

  const pendingPastValue = useMemo(
    () =>
      pastSales.reduce((sum, sale) => {
        if (sale.payment_status !== "pending") return sum
        return sum + Number(sale.total_amount || 0)
      }, 0),
    [pastSales]
  )

  const uniquePastCustomers = useMemo(() => {
    const customers = new Set(
      pastSales
        .map((sale) => sale.customer_name?.trim())
        .filter((name): name is string => Boolean(name))
    )
    return customers.size
  }, [pastSales])

  const oldestPastSaleLabel = useMemo(() => {
    if (pastSales.length === 0) return "No history yet"

    const oldest = [...pastSales].reduce((currentOldest, sale) => {
      return new Date(sale.sale_date).getTime() < new Date(currentOldest.sale_date).getTime() ? sale : currentOldest
    }, pastSales[0])

    return new Date(oldest.sale_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }, [pastSales])

  const recentPastSales = useMemo(() => pastSales.slice(0, 4), [pastSales])

  const viewOptions = [
    { id: "terminal" as const, label: "New Sale", icon: Plus },
    { id: "today" as const, label: "Today", icon: ShoppingCart },
    { id: "history" as const, label: "Past Sales", icon: History },
  ]

  return (
    <div className="min-h-full space-y-6 pb-6 bg-background/50">
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          {viewOptions.map((option) => {
            const Icon = option.icon
            return (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveView(option.id)}
                className={cn(
                  "h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest shadow-sm transition-all",
                  activeView === option.id
                    ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-500 hover:text-white"
                    : "border-zinc-300/70 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-[rgba(30,41,59,0.72)] dark:text-zinc-100 dark:hover:bg-[rgba(51,65,85,0.86)]"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {option.label}
              </Button>
            )
          })}
          <div className="hidden sm:flex items-center gap-2 rounded-xl border px-3 h-10 bg-card">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {todaySales.length} today
            </span>
          </div>
        </div>
      </div>

      {activeView === "terminal" ? (
        <section className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white/70 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-[rgba(30,41,59,0.52)]">
          <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-2.5 dark:border-white/8 dark:bg-[rgba(15,23,42,0.52)] sm:px-6">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">Sales Terminal</h3>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Fast checkout workspace</p>
          </div>
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
        </section>
      ) : activeView === "today" ? (
        <section className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white/70 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-[rgba(30,41,59,0.52)]">
          <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-2.5 dark:border-white/8 dark:bg-[rgba(15,23,42,0.52)] sm:px-6">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">Today&apos;s Sales</h3>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">Live activity and quick corrections</p>
          </div>
          <div className="p-4 sm:p-6">
            <RecentSales sales={todaySales} userId={userId} />
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-sm dark:border-white/8 dark:bg-[rgba(15,23,42,0.52)]">
          <div className="border-b border-zinc-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(135deg,rgba(250,250,250,0.98),rgba(244,244,245,0.92))] px-5 py-5 dark:border-white/8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.74))] sm:px-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <History className="h-3.5 w-3.5" />
                    Past Sales Workspace
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                      Sales history, collections, and old bills in one place.
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      Use this workspace to search older sales, reopen invoice history, review pending collections, and trace how past business moved across customers and payment modes.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView("terminal")}
                    className="h-10 rounded-xl border-zinc-300/70 bg-white/90 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-[rgba(30,41,59,0.8)] dark:text-zinc-100 dark:hover:bg-[rgba(51,65,85,0.86)]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Sale
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView("today")}
                    className="h-10 rounded-xl border-zinc-300/70 bg-white/90 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-[rgba(30,41,59,0.8)] dark:text-zinc-100 dark:hover:bg-[rgba(51,65,85,0.86)]"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Today View
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <HistoryMetric icon={FileClock} label="Past Records" value={pastSales.length.toString()} tone="default" />
                <HistoryMetric icon={Wallet} label="Past Value" value={`Rs ${Math.round(pastValue).toLocaleString("en-IN")}`} tone="default" />
                <HistoryMetric icon={CircleDollarSign} label="Pending Value" value={`Rs ${Math.round(pendingPastValue).toLocaleString("en-IN")}`} tone="warning" />
                <HistoryMetric icon={Users} label="Customers" value={uniquePastCustomers.toString()} tone="default" />
                <HistoryMetric icon={Clock3} label="Oldest Record" value={oldestPastSaleLabel} tone="default" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50/80 p-4 dark:border-white/8 dark:bg-[rgba(15,23,42,0.45)]">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Search className="h-4 w-4" />
                  <h4 className="text-sm font-black uppercase tracking-[0.18em]">History Explorer</h4>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Search old item names, customer names, dates, invoice references, or payment methods without leaving the archive.
                </p>

                <div className="mt-4 space-y-4">
                  {!settings.gst_enabled && (
                    <Input
                      value={historyQuery}
                      onChange={(event) => setHistoryQuery(event.target.value)}
                      placeholder="Search past sales"
                      className="h-11 rounded-xl border-zinc-200 bg-white dark:border-white/10 dark:bg-[rgba(15,23,42,0.52)]"
                    />
                  )}

                  <div className="rounded-[1.25rem] border border-dashed border-zinc-200 bg-white/80 p-3 dark:border-white/10 dark:bg-[rgba(30,41,59,0.5)]">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                      Active Slice
                    </div>
                    <div className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                      {settings.gst_enabled ? "Invoice-led history" : "Filtered ledger view"}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {settings.gst_enabled
                        ? "GST billing is enabled, so the archive stays invoice-first while keeping the workspace framing around it."
                        : `${filteredPastSales.length} matching sales ready to review in the ledger below.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50/80 p-4 dark:border-white/8 dark:bg-[rgba(15,23,42,0.45)]">
                <h4 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">Operations Snapshot</h4>
                <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span>Records today</span>
                    <span className="font-black text-zinc-950 dark:text-zinc-100">{todaySales.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Records in history</span>
                    <span className="font-black text-zinc-950 dark:text-zinc-100">{pastSales.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending in history</span>
                    <span className="font-black text-zinc-950 dark:text-zinc-100">{pendingPastCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending value</span>
                    <span className="font-black text-zinc-950 dark:text-zinc-100">
                      Rs {Math.round(pendingPastValue).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50/80 p-4 dark:border-white/8 dark:bg-[rgba(15,23,42,0.45)]">
                <h4 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">Recent From History</h4>
                <div className="mt-4 space-y-3">
                  {recentPastSales.length > 0 ? (
                    recentPastSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="rounded-[1rem] border border-zinc-200 bg-white/90 px-3 py-2.5 dark:border-white/10 dark:bg-[rgba(30,41,59,0.65)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                              {sale.customer_name || sale.inventory?.name || "Walk-in sale"}
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                              {new Date(sale.sale_date).toLocaleDateString("en-IN")} • {sale.payment_method || "Payment not set"}
                            </div>
                          </div>
                          <div className="text-right text-sm font-black text-zinc-950 dark:text-zinc-100">
                            Rs {Math.round(Number(sale.total_amount || 0)).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No older sales available yet.</p>
                  )}
                </div>
              </div>
            </aside>

            <div className="min-w-0 space-y-4">
              <div className="rounded-[1.75rem] border border-zinc-100 bg-white p-4 dark:border-white/8 dark:bg-[rgba(15,23,42,0.38)] sm:p-5">
                <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 dark:border-white/8 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">
                      {settings.gst_enabled ? "Invoice Archive" : "Past Sales Ledger"}
                    </h4>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {settings.gst_enabled
                        ? "Review past bills, invoice batches, and older GST-ready customer sales."
                        : "Browse older non-GST sales in a single searchable ledger view."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 dark:border-white/10 dark:bg-[rgba(30,41,59,0.65)] dark:text-zinc-300">
                      {settings.gst_enabled ? `${pastSales.length} records loaded` : `${filteredPastSales.length} results`}
                    </div>
                    <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 dark:border-white/10 dark:bg-[rgba(30,41,59,0.65)] dark:text-zinc-300">
                      Oldest {oldestPastSaleLabel}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {settings.gst_enabled ? (
                    <GstBills sales={allSales as Sale[]} org={org} />
                  ) : (
                    <RecentSales sales={filteredPastSales} userId={userId} />
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <HistoryCallout
                  title="Collections Focus"
                  value={`${pendingPastCount} pending`}
                  description={`Rs ${Math.round(pendingPastValue).toLocaleString("en-IN")} still sits in unsettled history.`}
                />
                <HistoryCallout
                  title="Customer Reach"
                  value={`${uniquePastCustomers} customers`}
                  description="Unique named customers found across older sales records."
                />
                <HistoryCallout
                  title="Current Momentum"
                  value={`Rs ${Math.round(todayValue).toLocaleString("en-IN")}`}
                  description="Today's billed value, kept visible while reviewing history."
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function HistoryMetric({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof History
  label: string
  value: string
  tone?: "default" | "warning"
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border px-4 py-3",
        tone === "warning"
          ? "border-amber-200 bg-amber-50/90 dark:border-amber-500/20 dark:bg-amber-500/10"
          : "border-zinc-200 bg-white dark:border-white/10 dark:bg-[rgba(30,41,59,0.72)]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          tone === "warning" ? "text-amber-700 dark:text-amber-200" : "text-zinc-500 dark:text-zinc-400"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="mt-3 text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-100">{value}</div>
    </div>
  )
}

function HistoryCallout({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50/80 p-4 dark:border-white/8 dark:bg-[rgba(15,23,42,0.45)]">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{title}</div>
      <div className="mt-3 text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">{value}</div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  )
}
