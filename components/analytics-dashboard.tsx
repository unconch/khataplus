"use client"

import { useState, useMemo, useEffect } from "react"
import { DailyReport } from "@/lib/types"
import { AccountingSummary } from "@/components/accounting-summary"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { subDays, startOfMonth, parseISO, format, endOfMonth, isValid } from "date-fns"
import { PerformanceTabs } from "./analytics/performance-tabs"

interface AnalyticsDashboardProps {
  reports: DailyReport[]
}

type AnalyticsRange = "THIS_MONTH" | "LAST_MONTH" | "CUSTOM"

export function AnalyticsDashboard({ reports }: AnalyticsDashboardProps) {
  const [range, setRange] = useState<AnalyticsRange>("THIS_MONTH")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredReports = useMemo(() => {
    const parsedDates = reports
      .map((r) => parseISO(r.report_date))
      .filter((d) => isValid(d))
    const anchorDate =
      parsedDates.length > 0
        ? new Date(Math.max(...parsedDates.map((d) => d.getTime())))
        : new Date()

    let startDate: Date
    let endDate: Date = anchorDate

    switch (range) {
      case "LAST_MONTH":
        startDate = startOfMonth(subDays(startOfMonth(anchorDate), 1))
        endDate = endOfMonth(subDays(startOfMonth(anchorDate), 1))
        break
      case "THIS_MONTH":
        startDate = startOfMonth(anchorDate)
        endDate = endOfMonth(anchorDate)
        break
      default:
        startDate = startOfMonth(anchorDate)
        endDate = endOfMonth(anchorDate)
    }

    return reports.filter((r) => {
      const d = parseISO(r.report_date)
      return d >= startDate && d <= endDate
    })
  }, [reports, range])

  const chartData = useMemo(() => {
    return filteredReports
      .slice()
      .reverse()
      .map((r) => ({
        date: format(parseISO(r.report_date), "dd MMM"),
        Revenue: r.total_sale_gross || 0,
        Profit: (r.total_sale_gross || 0) - (r.total_cost || 0) - (r.expenses || 0),
      }))
  }, [filteredReports])

  const paymentData = useMemo(() => {
    const totals = filteredReports.reduce(
      (acc, r) => ({
        Cash: acc.Cash + (r.cash_sale || 0),
        Online: acc.Online + (r.online_sale || 0),
      }),
      { Cash: 0, Online: 0 }
    )

    return [
      { name: "Cash", value: totals.Cash },
      { name: "Online", value: totals.Online },
    ]
  }, [filteredReports])

  return (
    <div className="min-h-screen bg-background text-foreground page-enter overflow-x-hidden space-y-10 max-w-6xl mx-auto">
      <PerformanceTabs active="analytics" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Live Insight Stream</span>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
          {[
            { key: "THIS_MONTH", label: "This Month" },
            { key: "LAST_MONTH", label: "Last Month" },
            { key: "CUSTOM", label: "Custom" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setRange(item.key as AnalyticsRange)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                range === item.key
                  ? "bg-white dark:bg-zinc-800 text-[#d97706] shadow-sm"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <AccountingSummary summaries={filteredReports} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-3 border border-zinc-100 dark:border-white/10 shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
          <div className="p-8 border-b border-zinc-50 dark:border-white/10 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Financial Stream</h3>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Net Profit vs Gross Revenue</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#d97706]" />
                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#16a34a]" />
                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Profit</span>
              </div>
            </div>
          </div>
          <CardContent className="p-8 text-left">
            <div className="h-[460px] w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="5 5" stroke="#2a2a2a" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#a1a1aa"
                      fontSize={10}
                      fontWeight={900}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#a1a1aa", letterSpacing: "0.05em" }}
                    />
                    <YAxis
                      stroke="#a1a1aa"
                      fontSize={10}
                      fontWeight={900}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `Rs ${val / 1000}K`}
                      tick={{ fill: "#a1a1aa" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #27272a",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.2)",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        fontSize: "10px",
                        background: "#09090b",
                        color: "#fafafa",
                      }}
                    />
                    <Area type="monotone" dataKey="Revenue" stroke="#d97706" strokeWidth={2} fill="#d97706" fillOpacity={0.08} animationDuration={1500} />
                    <Area type="monotone" dataKey="Profit" stroke="#16a34a" strokeWidth={2} fill="#16a34a" fillOpacity={0.1} animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-100 dark:border-white/10 shadow-sm overflow-hidden flex flex-col bg-white dark:bg-zinc-900">
          <div className="p-8 border-b border-zinc-50 dark:border-white/10">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight text-center">Liquidity Mix</h3>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center mt-1">Cash vs UPI distribution</p>
          </div>
          <CardContent className="p-8 flex-1 flex flex-col justify-center">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none" animationDuration={1000}>
                    <Cell fill="#16a34a" />
                    <Cell fill="#2563eb" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-8">
              {[
                { label: "Cash Flow", val: paymentData[0].value, color: "bg-[#16a34a]", text: "text-[#16a34a]" },
                { label: "Digital UPI", val: paymentData[1].value, color: "bg-[#2563eb]", text: "text-[#2563eb]" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", item.color)} />
                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className={cn("text-lg font-black italic tracking-tighter", item.text)}>
                    {Math.round((item.val / (paymentData[0].value + paymentData[1].value || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
