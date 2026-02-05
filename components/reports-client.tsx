"use client"

import { useState, useMemo } from "react"
import {
    Plus,
    FileText,
    Search,
    ChevronRight,
    TrendingUp,
    Calendar as LucideCalendar,
    FilterIcon,
    CalendarIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DailyReportForm } from "@/components/daily-report-form"
import { ExpenseManager } from "@/components/expense-manager"
import { DailyReport, Sale, InventoryItem, SystemSettings, Profile } from "@/lib/types"
import { format, subDays, isAfter, startOfMonth, parseISO, endOfMonth, addDays, isBefore, isSameMonth } from "date-fns"
import { cn } from "@/lib/utils"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { DateRange as DayPickerRange } from "react-day-picker"
import { getSalesByDate } from "@/lib/data"

type ReportRange = "7D" | "LAST_MONTH" | "THIS_MONTH" | "CUSTOM" | "SPECIFIC_MONTH"

interface ReportsClientProps {
    initialReports: DailyReport[]
    settings: SystemSettings
    profile: Profile | null
    userId: string
}

export function ReportsClient({ initialReports, settings, profile, userId }: ReportsClientProps) {
    const [reports, setReports] = useState<DailyReport[]>(initialReports)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)
    const [dailySales, setDailySales] = useState<(Sale & { inventory?: InventoryItem })[]>([])
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [loadingSales, setLoadingSales] = useState(false)
    const [range, setRange] = useState<ReportRange>("THIS_MONTH")
    const [customDate, setCustomDate] = useState<DayPickerRange | undefined>()
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"))

    const isRestrictedStaff = profile?.role === "staff" && settings?.allow_staff_reports_entry_only

    const handleViewStatement = async (report: DailyReport) => {
        setSelectedReport(report)
        setIsDrawerOpen(true)
        setLoadingSales(true)
        try {
            const sales = await getSalesByDate(report.report_date)
            setDailySales(sales)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingSales(false)
        }
    }

    const filteredReports = useMemo(() => {
        const now = new Date()
        let startDate: Date

        if (range === "SPECIFIC_MONTH") {
            startDate = parseISO(selectedMonth + "-01")
            return reports.filter((r) => {
                const d = parseISO(r.report_date)
                return isSameMonth(d, startDate)
            })
        }

        if (range === "CUSTOM") {
            if (customDate?.from && customDate?.to) {
                startDate = customDate.from
                const endDate = customDate.to
                return reports.filter((r) => {
                    const d = parseISO(r.report_date)
                    return (isAfter(d, subDays(startDate, 1)) && isBefore(d, addDays(endDate, 1)))
                })
            }
            return reports
        }

        let endDate = now
        switch (range) {
            case "7D":
                startDate = subDays(now, 7)
                break
            case "LAST_MONTH":
                startDate = startOfMonth(subDays(startOfMonth(now), 1))
                endDate = endOfMonth(subDays(startOfMonth(now), 1))
                break
            case "THIS_MONTH":
                startDate = startOfMonth(now)
                break
            default:
                startDate = startOfMonth(now)
        }

        return reports.filter((r) => {
            const d = parseISO(r.report_date)
            if (range === "LAST_MONTH") {
                return isAfter(d, subDays(startDate, 1)) && isBefore(d, addDays(endDate, 1))
            }
            return isAfter(d, startDate)
        })
    }, [reports, range, customDate, selectedMonth])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center glass-card bg-card/40 p-5 rounded-[2rem] border-white/10 animate-slide-up stagger-1 group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform duration-500">
                        <FileText className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{isRestrictedStaff ? "Mode" : "History"}</span>
                        <span className="text-xl font-black tracking-tighter">{isRestrictedStaff ? "Secure Entry" : `${filteredReports.length} Records`}</span>
                    </div>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-2xl px-8 font-bold shadow-xl shadow-primary/10 active-scale hover:shadow-primary/20 transition-all duration-500">
                            <Plus className="h-5 w-5 mr-2 stroke-[3]" />
                            New Record
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-card shadow-2xl rounded-[2.5rem] focus:outline-none">
                        <div className="p-8 border-b border-white/5 bg-linear-to-b from-muted/20 to-transparent">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tighter">Daily Ledger Entry</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                    Strategic Financial Audit • Data Point Collection
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="max-h-[80vh] overflow-y-auto px-8 py-6 custom-scrollbar">
                            <DailyReportForm
                                profileId={userId}
                                onSuccess={() => {
                                    setIsFormOpen(false)
                                    // Soft refresh (we could fetch reports again here or just rely on router refresh from parent)
                                    window.location.reload()
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Expense Manager Section */}
            {!isRestrictedStaff && (
                <div className="animate-slide-up stagger-2">
                    <ExpenseManager userId={userId} />
                </div>
            )}

            {/* Filter Section */}
            {!isRestrictedStaff && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar animate-slide-up stagger-1">
                    <Button
                        onClick={() => setRange("THIS_MONTH")}
                        className={cn(
                            "whitespace-nowrap px-6 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border shadow-sm h-auto",
                            range === "THIS_MONTH"
                                ? "bg-primary text-white border-primary shadow-primary/20 scale-[1.02] hover:bg-primary"
                                : "bg-white/50 text-muted-foreground border-border/10 hover:bg-primary/5 hover:text-primary dark:bg-zinc-900/50"
                        )}
                        variant="ghost"
                    >
                        This Month
                    </Button>

                    <Button
                        onClick={() => setRange("LAST_MONTH")}
                        className={cn(
                            "whitespace-nowrap px-6 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border shadow-sm h-auto",
                            range === "LAST_MONTH"
                                ? "bg-primary text-white border-primary shadow-primary/20 scale-[1.02] hover:bg-primary"
                                : "bg-white/50 text-muted-foreground border-border/10 hover:bg-primary/5 hover:text-primary dark:bg-zinc-900/50"
                        )}
                        variant="ghost"
                    >
                        Last Month
                    </Button>

                    <select
                        className={cn(
                            "whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border shadow-sm h-auto focus:outline-none appearance-none bg-white/50 dark:bg-zinc-900/50 text-muted-foreground border-border/10 hover:bg-primary/5 hover:text-primary cursor-pointer min-w-[140px]",
                            range === "SPECIFIC_MONTH" && "bg-primary text-white border-primary shadow-primary/20"
                        )}
                        value={selectedMonth}
                        onChange={(e) => {
                            setSelectedMonth(e.target.value)
                            setRange("SPECIFIC_MONTH")
                        }}
                    >
                        {Array.from({ length: 12 }).map((_, i) => {
                            const d = subDays(startOfMonth(new Date()), i * 30)
                            const val = format(d, "yyyy-MM")
                            const label = format(d, "MMMM yyyy")
                            return <option key={val} value={val} className="text-foreground bg-background">{label}</option>
                        })}
                    </select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                className={cn(
                                    "whitespace-nowrap px-6 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border shadow-sm flex items-center gap-2 h-auto",
                                    range === "CUSTOM"
                                        ? "bg-primary text-white border-primary shadow-primary/20 scale-[1.02] hover:bg-primary"
                                        : "bg-white/50 text-muted-foreground border-border/10 hover:bg-primary/5 hover:text-primary dark:bg-zinc-900/50"
                                )}
                                variant="ghost"
                            >
                                <span className="sr-only">Open custom filter</span>
                                <FilterIcon className="h-3.5 w-3.5" />
                                Custom Range
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 glass rounded-[2rem] border-white/20 shadow-2xl relative z-[100]" align="start">
                            <div className="p-5 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Detailed Audit Range</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">Start Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full bg-black/5 dark:bg-white/10 border-none rounded-xl px-3 py-2 text-[11px] justify-start font-normal h-9",
                                                            !customDate?.from && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                                        {customDate?.from ? format(customDate.from, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 rounded-[2rem] overflow-hidden border-white/20 glass shadow-2xl" align="start">
                                                    <CalendarUI
                                                        mode="single"
                                                        selected={customDate?.from}
                                                        onSelect={(date) => setCustomDate(prev => ({ from: date || undefined, to: prev?.to }))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">End Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full bg-black/5 dark:bg-white/10 border-none rounded-xl px-3 py-2 text-[11px] justify-start font-normal h-9",
                                                            !customDate?.to && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                                        {customDate?.to ? format(customDate.to, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 rounded-[2rem] overflow-hidden border-white/20 glass shadow-2xl" align="start">
                                                    <CalendarUI
                                                        mode="single"
                                                        selected={customDate?.to}
                                                        onSelect={(date) => setCustomDate(prev => ({ from: prev?.from, to: date || undefined }))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full rounded-xl bg-primary text-white hover:bg-primary/90 font-bold text-xs h-10 shadow-lg shadow-primary/20"
                                        onClick={() => setRange("CUSTOM")}
                                    >
                                        Filter History
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            <div className="grid gap-5">
                {isRestrictedStaff ? (
                    <div className="text-center p-20 glass-card bg-card/20 rounded-[2.5rem] border-dashed border-2 border-white/10 flex flex-col items-center gap-4 group">
                        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                            <Search className="h-10 w-10 text-amber-500/50" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-bold tracking-tight text-muted-foreground">Restricted View</p>
                            <p className="text-sm text-muted-foreground/60 max-w-[280px] mx-auto">
                                Transaction history is hidden for staff. Use the "New Record" button to submit a report.
                            </p>
                        </div>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="text-center p-20 glass-card bg-card/20 rounded-[2.5rem] border-dashed border-2 border-white/10 flex flex-col items-center gap-4 group">
                        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-bold tracking-tight text-muted-foreground">Empty Ledger</p>
                            <p className="text-sm text-muted-foreground/60">No reports found for this period.</p>
                        </div>
                    </div>
                ) : (
                    filteredReports.map((report: DailyReport, idx: number) => {
                        const netResult = report.total_sale_gross - report.total_cost - report.expenses
                        const isProfit = netResult >= 0

                        return (
                            <Card key={report.id} className={cn(
                                "overflow-hidden glass-card bg-card/30 border-white/10 group animate-slide-up hover:shadow-2xl transition-all duration-500 hover:-translate-y-1",
                                idx === 0 ? "stagger-2" : idx === 1 ? "stagger-3" : "stagger-4"
                            )}>
                                <CardContent className="p-0">
                                    {/* Header: Date and Net Result */}
                                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-linear-to-r from-muted/20 to-transparent">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                                                <LucideCalendar className="h-5 w-5 stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <p className="font-black text-lg tracking-tighter">{format(new Date(report.report_date), "dd MMMM, yyyy")}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Ledger Entry • {format(new Date(report.created_at), "hh:mm a")}</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-2 rounded-2xl border flex flex-col items-end group-hover:scale-105 transition-transform duration-500",
                                            isProfit
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/5"
                                                : "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/5"
                                        )}>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">Net Result</span>
                                            <span className="text-xl font-black tracking-tighter leading-none">
                                                {isProfit ? "+" : ""}₹{netResult.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body: Two Column Ledger */}
                                    <div className="grid grid-cols-1 md:grid-cols-1 divide-y md:divide-y-0 divide-white/5">
                                        {/* Revenue Column - HIDDEN per user request */}
                                        {false && (
                                            <div className="p-6 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Business Inflow</p>
                                                    <TrendingUp className="h-3 w-3 text-emerald-500/50" />
                                                </div>
                                                <div>
                                                    <p className="text-3xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500 origin-left">
                                                        ₹{report.total_sale_gross.toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Gross Revenue</p>
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <div className="flex-1 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 group/sub">
                                                        <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-1">Cash</p>
                                                        <p className="text-sm font-black tracking-tight">₹{report.cash_sale.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex-1 p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 group/sub">
                                                        <p className="text-[9px] font-black text-purple-500/60 uppercase tracking-widest mb-1">Online</p>
                                                        <p className="text-sm font-black tracking-tight">₹{report.online_sale.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Costs Column */}
                                        <div className="p-6 space-y-4 bg-muted/5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Business Outflow</p>
                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500/50 animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black tracking-tighter text-foreground/80">
                                                    ₹{(report.total_cost + report.expenses).toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Total Liability</p>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Purchases</p>
                                                    <p className="text-sm font-black tracking-tight">₹{report.total_cost.toLocaleString()}</p>
                                                </div>
                                                <div className="flex-1 p-3 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                                                    <p className="text-[9px] font-black text-orange-500/60 uppercase tracking-widest mb-1">Expenses</p>
                                                    <p className="text-sm font-black tracking-tight text-orange-500/80">₹{report.expenses.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Action */}
                                    <button
                                        onClick={() => handleViewStatement(report)}
                                        className="w-full p-4 bg-muted/10 hover:bg-muted/20 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all duration-300 flex items-center justify-center gap-2 border-t border-white/5 group/btn"
                                    >
                                        View Full Statement <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="max-h-[85vh] border-white/10 glass-card bg-zinc-950/90 text-foreground">
                    <DrawerHeader className="border-b border-white/5 pb-6">
                        <div className="flex items-center justify-between mb-2">
                            <DrawerTitle className="text-2xl font-black tracking-tighter">
                                {selectedReport ? format(new Date(selectedReport.report_date), "dd MMMM, yyyy") : "Daily Statement"}
                            </DrawerTitle>
                            {selectedReport && (
                                <Badge className={cn(
                                    "px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider",
                                    (selectedReport.total_sale_gross - selectedReport.total_cost - selectedReport.expenses) >= 0
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}>
                                    Net: ₹{(selectedReport.total_sale_gross - selectedReport.total_cost - selectedReport.expenses).toLocaleString()}
                                </Badge>
                            )}
                        </div>
                        <DrawerDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                            Transaction Breakdown • Detailed Audit
                        </DrawerDescription>
                        <div className="mt-4 py-1.5 px-4 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-flex items-center gap-2 mx-auto">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Work In Progress</span>
                        </div>
                    </DrawerHeader>

                    <div className="p-6 overflow-y-auto min-h-[40vh]">
                        {loadingSales ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retrieving ledger...</p>
                            </div>
                        ) : dailySales.length === 0 ? (
                            <div className="text-center py-20 opacity-40">
                                <Search className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold">No individual transactions found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {dailySales.map((sale, i) => (
                                    <div key={sale.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-black tracking-tight text-lg">{sale.inventory?.name || "Uncategorized"}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    Qty: {sale.quantity} • ₹{sale.sale_price.toLocaleString()} / unit
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-lg tracking-tighter">₹{sale.total_amount.toLocaleString()}</p>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider h-5 bg-primary/5 hover:bg-primary/5 text-primary border-primary/10">
                                                    {sale.payment_method}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                            <div className="flex gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Cost</p>
                                                    <p className="text-xs font-bold">₹{(sale.total_amount - sale.profit).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Margin</p>
                                                    <p className={cn("text-xs font-bold", sale.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                        ₹{sale.profit.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tabular-nums">
                                                {format(new Date(sale.created_at), "hh:mm:ss a")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DrawerFooter className="border-t border-white/5 pt-6 bg-zinc-950/50">
                        <DrawerClose asChild>
                            <Button variant="outline" className="h-12 rounded-xl font-black uppercase tracking-widest border-white/10 hover:bg-white/5">
                                Close Statement
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
