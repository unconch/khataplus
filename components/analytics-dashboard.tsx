"use client"

import { useState, useMemo, useEffect } from "react"
import { DailyReport } from "@/lib/types"
import { AccountingSummary } from "@/components/accounting-summary"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
} from "recharts"
import { CalendarIcon, FilterIcon, Loader2, TrendingUp } from "lucide-react"
import { subDays, isAfter, startOfMonth, parseISO, format, endOfMonth, addDays, isBefore } from "date-fns"
import { DateRange as DayPickerRange } from "react-day-picker"

interface AnalyticsDashboardProps {
    reports: DailyReport[]
}

type AnalyticsRange = "7D" | "LAST_MONTH" | "THIS_MONTH" | "CUSTOM" | "SPECIFIC_MONTH"

export function AnalyticsDashboard({ reports }: AnalyticsDashboardProps) {
    // Auto-select LAST_MONTH if it's the start of a new month (1st-5th)
    const [range, setRange] = useState<AnalyticsRange>(() => {
        const today = new Date().getDate()
        return today <= 5 ? "LAST_MONTH" : "THIS_MONTH"
    })
    const [customDate, setCustomDate] = useState<DayPickerRange | undefined>()
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"))
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const filteredReports = useMemo(() => {
        const now = new Date()
        let startDate: Date
        let endDate: Date = now

        if (range === "SPECIFIC_MONTH") {
            startDate = startOfMonth(parseISO(selectedMonth + "-01"))
            endDate = endOfMonth(startDate)
            return reports.filter((r) => {
                const d = parseISO(r.report_date)
                return (isAfter(d, subDays(startDate, 1)) && isBefore(d, addDays(endDate, 1)))
            })
        }

        if (range === "CUSTOM") {
            if (customDate?.from && customDate?.to) {
                startDate = customDate.from
                endDate = customDate.to
                return reports.filter((r) => {
                    const d = parseISO(r.report_date)
                    return (isAfter(d, subDays(startDate, 1)) && isBefore(d, addDays(endDate, 1)))
                })
            }
            return reports
        }

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

    // Prepare Chart Data
    const chartData = useMemo(() => {
        return filteredReports
            .slice()
            .reverse() // chart needs chronological order
            .map(r => ({
                date: format(parseISO(r.report_date), "dd MMM"),
                Revenue: r.total_sale_gross,
                Profit: r.total_sale_gross - r.total_cost - r.expenses,
                Expenses: r.expenses
            }))
    }, [filteredReports])

    const paymentData = useMemo(() => {
        const totals = filteredReports.reduce((acc, r) => ({
            Cash: acc.Cash + r.cash_sale,
            Online: acc.Online + r.online_sale
        }), { Cash: 0, Online: 0 })

        return [
            { name: "Cash", value: totals.Cash },
            { name: "Online", value: totals.Online }
        ]
    }, [filteredReports])

    const COLORS = ["#10b981", "#3b82f6"] // Emerald, Blue

    return (
        <div className="space-y-6 animate-slide-up stagger-1">
            {/* Finance Filters Style */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
                {/* Quick Buttons */}
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

                {/* Month Dropdown */}
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
                        const d = subDays(startOfMonth(new Date()), i * 30) // Simplified month back calculation
                        const val = format(d, "yyyy-MM")
                        const label = format(d, "MMMM yyyy")
                        return <option key={val} value={val} className="text-foreground bg-background">{label}</option>
                    })}
                </select>

                {/* Custom Filter Popover */}
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
                                                <Calendar
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
                                                <Calendar
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

            {/* Summary Cards */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                <AccountingSummary summaries={filteredReports} />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">

                {/* Trend Chart */}
                <Card className="lg:col-span-2 xl:col-span-3 shadow-2xl glass-card bg-card/40 border-white/10 overflow-hidden group/chart transform transition-all duration-500 hover:shadow-primary/5">
                    <CardHeader className="pb-6 px-8 pt-8 border-b border-white/5 bg-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tighter italic">Revenue & Profit Engine</CardTitle>
                                <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Real-time financial performance audit</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                                <TrendingUp className="text-primary h-5 w-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[450px] w-full mt-4">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="currentColor"
                                            className="text-muted-foreground/50 font-black"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ dy: 15 }}
                                        />
                                        <YAxis
                                            stroke="currentColor"
                                            className="text-muted-foreground/50 font-black"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(16px)', borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                                            labelStyle={{ color: 'white', fontWeight: '900', fontSize: '14px', marginBottom: '8px', letterSpacing: '-0.02em' }}
                                            itemStyle={{ fontWeight: '700', fontSize: '12px' }}
                                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                        />
                                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '40px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="Revenue"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }}
                                            animationDuration={2000}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="Profit"
                                            stroke="#10b981"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorProfit)"
                                            activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-zinc-900/10 rounded-[2.5rem] animate-pulse">
                                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Method Chart */}
                <Card className="shadow-2xl glass-card bg-card/40 border-white/10 overflow-hidden group/pie transform transition-all duration-500 hover:shadow-primary/5 flex flex-col">
                    <CardHeader className="pb-6 px-8 pt-8 border-b border-white/5 bg-white/5">
                        <CardTitle className="text-xl font-black tracking-tight italic text-center">Liquidity Split</CardTitle>
                        <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] text-center mt-1">Cash vs Digital distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex-1 flex flex-col justify-between">
                        <div className="h-[280px] w-full mt-4">
                            {isMounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={75}
                                            outerRadius={105}
                                            paddingAngle={10}
                                            dataKey="value"
                                            stroke="none"
                                            animationDuration={2000}
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(16px)', borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                                            formatter={(value: number) => [<span className="font-black text-white">₹{value.toLocaleString('en-IN')}</span>, "Volume"]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-zinc-900/10 rounded-[2.5rem] animate-pulse">
                                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 mt-8">
                            <div className="flex items-center justify-between p-5 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 group-hover/pie:bg-emerald-500/10 transition-all duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                    <p className="text-[10px] text-emerald-600/70 uppercase font-black tracking-widest">Liquid Cash</p>
                                </div>
                                <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                                    {Math.round((paymentData[0].value / (paymentData[0].value + paymentData[1].value || 1)) * 100)}%
                                </p>
                            </div>
                            <div className="flex items-center justify-between p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10 group-hover/pie:bg-blue-500/10 transition-all duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <p className="text-[10px] text-blue-600/70 uppercase font-black tracking-widest">Digital App</p>
                                </div>
                                <p className="text-2xl font-black text-blue-600 tracking-tighter">
                                    {Math.round((paymentData[1].value / (paymentData[0].value + paymentData[1].value || 1)) * 100)}%
                                </p>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
