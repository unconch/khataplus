"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import { CalendarDays, Download, Search, TrendingUp, Receipt, Wallet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PerformanceTabs } from "@/components/analytics/performance-tabs"
import type { DailyReport } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { ImportDialog } from "@/components/import-dialog"

interface ReportsViewProps {
    orgId: string
    orgSlug: string
}

type ReportRange = "today" | "week" | "month" | "year"

const INR = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
})

export function ReportsView({ orgId }: ReportsViewProps) {
    const [reports, setReports] = useState<DailyReport[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [range, setRange] = useState<ReportRange>("month")

    useEffect(() => {
        void fetchReports()
    }, [orgId, range])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/reports?orgId=${orgId}&range=${range}`, { cache: "no-store" })
            const data = await res.json()
            setReports(data.reports || [])
        } catch (err) {
            console.error(err)
            setReports([])
        } finally {
            setLoading(false)
        }
    }

    const filteredReports = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return reports

        return reports.filter((report) => {
            const dateLabel = format(parseISO(report.report_date), "dd MMM yyyy").toLowerCase()
            const gross = String(report.total_sale_gross)
            const cash = String(report.cash_sale)
            const online = String(report.online_sale)
            return dateLabel.includes(q) || gross.includes(q) || cash.includes(q) || online.includes(q)
        })
    }, [reports, searchQuery])

    const summary = useMemo(() => {
        const gross = filteredReports.reduce((acc, r) => acc + (r.total_sale_gross || 0), 0)
        const expenses = filteredReports.reduce((acc, r) => acc + (r.expenses || 0), 0)
        const profit = filteredReports.reduce(
            (acc, r) => acc + ((r.total_sale_gross || 0) - (r.total_cost || 0) - (r.expenses || 0)),
            0
        )
        return {
            days: filteredReports.length,
            gross,
            expenses,
            profit,
        }
    }, [filteredReports])

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden space-y-8 max-w-6xl mx-auto">
            <PerformanceTabs active="reports" />

            {/* Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Archived Sales Ledger</span>
                </div>

                <div className="flex items-center gap-3">
                    <ImportDialog
                        type="expense"
                        orgId={orgId}
                        trigger={
                            <Button
                                variant="outline"
                                className="h-9 px-4 rounded-xl border-zinc-200 dark:border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active-scale"
                            >
                                <Receipt className="mr-2 h-4 w-4" />
                                Bulk Import
                            </Button>
                        }
                    />
                    <Button
                        className="h-9 px-6 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active-scale"
                        onClick={() => {
                            window.print();
                            import("sonner").then(({ toast }) => {
                                toast.success("Generating Document", { description: "Preparing historical data for archive." });
                            });
                        }}
                    >
                        <Download size={14} className="mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={CalendarDays} label="Report Days" value={String(summary.days)} />
                <StatCard icon={Wallet} label="Gross Sales" value={INR.format(summary.gross)} />
                <StatCard icon={Receipt} label="Expenses" value={INR.format(summary.expenses)} />
                <StatCard icon={TrendingUp} label="Net Profit" value={INR.format(summary.profit)} />
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-white/10 shadow-sm">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search by date or amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-white/10 rounded-xl font-semibold text-sm"
                    />
                </div>

                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full lg:w-auto">
                    {[
                        { key: "today", label: "Today" },
                        { key: "week", label: "7 Days" },
                        { key: "month", label: "30 Days" },
                        { key: "year", label: "1 Year" },
                    ].map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setRange(item.key as ReportRange)}
                            className={
                                "flex-1 lg:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all " +
                                (range === item.key ? "bg-white dark:bg-zinc-900 text-[#2563eb] shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200")
                            }
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-white/10 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-white/10">
                            <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Gross Sales</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Cash</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Online</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Expenses</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Net Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/10">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500 font-bold">
                                    Loading daily sales reports...
                                </td>
                            </tr>
                        ) : filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500 font-bold">
                                    No daily sales data found for this range.
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => {
                                const profit = (report.total_sale_gross || 0) - (report.total_cost || 0) - (report.expenses || 0)
                                return (
                                    <tr key={report.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/60 transition-colors">
                                        <td className="px-6 py-4 text-left">
                                            <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                                                {format(parseISO(report.report_date), "dd MMM yyyy")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-zinc-900 dark:text-zinc-100">{INR.format(report.total_sale_gross || 0)}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">{INR.format(report.cash_sale || 0)}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">{INR.format(report.online_sale || 0)}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">{INR.format(report.expenses || 0)}</td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">{INR.format(profit)}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-white/10 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-3">
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">{value}</div>
        </div>
    )
}
