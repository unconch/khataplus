"use client"

import type { DailyReport } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUpIcon, BanknoteIcon, WalletIcon, TrendingDownIcon, PercentIcon, CalendarIcon, CreditCardIcon } from "lucide-react"

interface AccountingSummaryProps {
  summaries: DailyReport[]
}

export function AccountingSummary({ summaries }: AccountingSummaryProps) {
  const totals = summaries.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.total_sale_gross,
      expenses: acc.expenses + s.expenses,
      netProfit: acc.netProfit + (s.total_sale_gross - s.total_cost - s.expenses),
      cash: acc.cash + s.cash_sale,
      online: acc.online + s.online_sale,
    }),
    { revenue: 0, expenses: 0, netProfit: 0, cash: 0, online: 0 },
  )

  const margin = totals.revenue > 0 ? ((totals.netProfit / totals.revenue) * 100).toFixed(1) : "0"

  // Find highest profit day
  const bestDay = summaries.reduce((best, current) => {
    const currentProfit = current.total_sale_gross - current.total_cost - current.expenses
    const bestProfit = best ? (best.total_sale_gross - best.total_cost - best.expenses) : -Infinity
    return currentProfit > bestProfit ? current : best
  }, null as DailyReport | null)

  const bestDayProfit = bestDay ? (bestDay.total_sale_gross - bestDay.total_cost - bestDay.expenses) : 0

  return (
    <div className="space-y-6">
      {/* Hero Cards - Vibrant Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white overflow-hidden relative group hover:scale-[1.02] transition-all duration-500">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100/80 font-bold text-[10px] uppercase tracking-[0.2em]">Total Revenue</p>
                <h3 className="text-3xl font-black mt-2 tracking-tight">₹{Number(totals.revenue).toLocaleString('en-IN')}</h3>
              </div>
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-500">
                <TrendingUpIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="bg-black/20 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 uppercase tracking-wider">{summaries.length} Reports</span>
              <span className="text-indigo-100/60 text-[10px] font-medium italic">Current period</span>
            </div>
          </CardContent>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </Card>

        <Card className="border-none shadow-xl bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white overflow-hidden relative group hover:scale-[1.02] transition-all duration-500">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100/80 font-bold text-[10px] uppercase tracking-[0.2em]">Net Profit</p>
                <h3 className="text-3xl font-black mt-2 tracking-tight">₹{Number(totals.netProfit).toLocaleString('en-IN')}</h3>
              </div>
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-500">
                <BanknoteIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px] font-black border border-white/10 flex items-center gap-1 uppercase tracking-wider">
                <PercentIcon className="h-3 w-3" /> {margin}% Margin
              </span>
            </div>
          </CardContent>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </Card>

        <Card className="border-none shadow-xl bg-linear-to-br from-rose-500 via-rose-600 to-orange-700 text-white overflow-hidden relative group hover:scale-[1.02] transition-all duration-500">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-rose-100/80 font-bold text-[10px] uppercase tracking-[0.2em]">Total Expenses</p>
                <h3 className="text-3xl font-black mt-2 tracking-tight">₹{Number(totals.expenses).toLocaleString('en-IN')}</h3>
              </div>
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-500">
                <TrendingDownIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-rose-100/80">
                <span>Expense Ratio</span>
                <span>{totals.revenue > 0 ? ((totals.expenses / totals.revenue) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden border border-white/10">
                <div className="bg-linear-to-r from-white/40 to-white h-full rounded-full transition-all duration-1000" style={{ width: `${totals.revenue > 0 ? (totals.expenses / totals.revenue * 100) : 0}%` }} />
              </div>
            </div>
          </CardContent>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card bg-card/40 border-white/10 overflow-hidden group">
          <CardContent className="p-4 flex flex-col gap-1.5 relative overflow-hidden">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Cash Sales</span>
            <div className="flex items-end justify-between">
              <p className="text-xl font-bold tracking-tight">₹{Number(totals.cash).toLocaleString('en-IN')}</p>
              <WalletIcon className="h-4 w-4 text-emerald-500 mb-1 group-hover:scale-125 transition-transform duration-500" />
            </div>
            <div className="h-1.5 w-full bg-emerald-500/10 rounded-full mt-1.5 border border-emerald-500/5 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totals.revenue > 0 ? (totals.cash / totals.revenue * 100) : 0}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-card/40 border-white/10 overflow-hidden group">
          <CardContent className="p-4 flex flex-col gap-1.5 relative overflow-hidden">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Online Sales</span>
            <div className="flex items-end justify-between">
              <p className="text-xl font-bold tracking-tight">₹{Number(totals.online).toLocaleString('en-IN')}</p>
              <CreditCardIcon className="h-4 w-4 text-blue-500 mb-1 group-hover:scale-125 transition-transform duration-500" />
            </div>
            <div className="h-1.5 w-full bg-blue-500/10 rounded-full mt-1.5 border border-blue-500/5 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totals.revenue > 0 ? (totals.online / totals.revenue * 100) : 0}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-card/40 border-white/10 col-span-2 md:col-span-2 group">
          <CardContent className="p-4 flex items-center justify-between relative overflow-hidden">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Performance Peak</span>
              <p className="text-lg font-bold tracking-tight">
                {bestDay ? new Date(bestDay.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <p className="text-base font-black text-emerald-600">+₹{Number(bestDayProfit).toLocaleString('en-IN')}</p>
                <TrendingUpIcon className="h-3.5 w-3.5 text-emerald-500 group-hover:translate-y--0.5 transition-transform" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Highest daily net</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Daily Breakdown
        </h3>
        {summaries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No reports available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {summaries.map((report) => (
              <Card key={report.id} className="glass-card bg-card/30 border-white/10 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4 border-b pb-3 border-dashed border-muted-foreground/20">
                    <p className="font-bold text-lg tracking-tight">
                      {new Date(report.report_date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                    <span className={report.total_sale_gross - report.total_cost - report.expenses > 0 ? "text-emerald-500 text-[10px] font-black bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest" : "text-rose-500 text-[10px] font-black bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 uppercase tracking-widest"}>
                      {((report.total_sale_gross - report.total_cost - report.expenses) / (report.total_sale_gross || 1) * 100).toFixed(0)}% Margin
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Revenue</p>
                      <p className="font-black text-lg tracking-tight">₹{Number(report.total_sale_gross).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Expenses</p>
                      <p className="font-black text-lg tracking-tight text-rose-500/80">₹{Number(report.expenses).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Net Profit</p>
                      <p className="font-black text-xl tracking-tight text-emerald-500 underline decoration-emerald-500/20 underline-offset-4">
                        ₹{Number(report.total_sale_gross - report.total_cost - report.expenses).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

