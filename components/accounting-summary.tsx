"use client"

import type { DailyReport } from "@/lib/types"
import { TrendingUp, Banknote, TrendingDown, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountingSummaryProps {
  summaries: DailyReport[]
}

export function AccountingSummary({ summaries }: AccountingSummaryProps) {
  const totals = summaries.reduce(
    (acc, s) => ({
      revenue: acc.revenue + (s.total_sale_gross || 0),
      expenses: acc.expenses + (s.expenses || 0),
      netProfit: acc.netProfit + ((s.total_sale_gross || 0) - (s.total_cost || 0) - (s.expenses || 0)),
      cash: acc.cash + (s.cash_sale || 0),
      online: acc.online + (s.online_sale || 0),
    }),
    { revenue: 0, expenses: 0, netProfit: 0, cash: 0, online: 0 }
  )

  const margin = totals.revenue > 0 ? ((totals.netProfit / totals.revenue) * 100).toFixed(1) : "0"
  const collectedPayments = totals.cash + totals.online

  const MetricItem = ({ icon: Icon, label, value, subLabel, isDark }: any) => (
    <div
      className={cn(
        "flex-1 flex items-center gap-5 p-6 lg:p-8 transition-all relative overflow-hidden",
        isDark ? "bg-zinc-950 text-white" : "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          isDark ? "bg-white/10 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] opacity-50",
            isDark && "text-white opacity-80"
          )}
        >
          {label}
        </span>
        <div className="flex flex-col items-start gap-1">
          <span className="text-2xl font-black tracking-tight whitespace-nowrap tabular-nums">₹ {Math.round(value).toLocaleString("en-IN")}</span>
          {subLabel && (
            <span className={cn("text-[10px] font-bold uppercase whitespace-nowrap", isDark ? "text-white/85" : "opacity-40")}>
              {subLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-white/10 flex flex-col md:flex-row transition-all hover:shadow-md">
      <MetricItem icon={TrendingUp} label="Total Sales" value={totals.revenue} subLabel="Before costs" />
      <MetricItem icon={Banknote} label="Net Profit" value={totals.netProfit} subLabel={`${margin}% margin`} />
      <MetricItem icon={TrendingDown} label="Expenses" value={totals.expenses} subLabel="Operational spend" />
      <MetricItem icon={Wallet} label="Collected Payments" value={collectedPayments} subLabel={`Cash ₹${Math.round(totals.cash).toLocaleString("en-IN")} + UPI ₹${Math.round(totals.online).toLocaleString("en-IN")}`} />
    </div>
  )
}
