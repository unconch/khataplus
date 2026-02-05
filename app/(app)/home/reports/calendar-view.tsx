
"use client"

import { useState } from "react"
import { DailyReport } from "@/lib/types"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CalendarViewProps {
    reports: DailyReport[]
    onSelectReport: (report: DailyReport) => void
}

export function CalendarView({ reports, onSelectReport }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Calendar grid padding (empty cells before 1st of month)
    const startDay = getDay(monthStart) // 0 = Sunday, 1 = Monday...
    const paddingDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }) // Adjust for Monday start if needed, defaulting to Sunday start (0) for now but usually generic calendar is Sun-Sat. Let's do Monday start for business apps often.
    // Actually, let's stick to standard Sunday start (0) for simplicity or match date-fns default. 
    // If getDay(monthStart) is 2 (Tuesday), we need 2 empty slots (Sun, Mon).

    const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black tracking-tight">{format(currentDate, "MMMM yyyy")}</h2>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={previousMonth} className="h-8 w-8 rounded-lg">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:flex">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Profit
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500" /> Loss
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-muted" /> No Data
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
                {/* Weekday Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 py-2">
                        {day}
                    </div>
                ))}

                {/* Empty Padding Days */}
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`padding-${i}`} className="h-32 rounded-2xl bg-transparent" />
                ))}

                {/* Days */}
                {daysInMonth.map(day => {
                    const report = reports.find(r => isSameDay(new Date(r.report_date), day))
                    const net = report ? (report.total_sale_gross - report.total_cost - report.expenses) : 0
                    const isProfit = net >= 0
                    const hasData = !!report

                    return (
                        <TooltipProvider key={day.toISOString()}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={() => report && onSelectReport(report)}
                                        className={cn(
                                            "h-24 md:h-32 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group border",
                                            hasData
                                                ? "cursor-pointer hover:scale-[1.02]"
                                                : "bg-muted/5 border-white/5 opacity-50 cursor-default",
                                            hasData && isProfit ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" : "",
                                            hasData && !isProfit ? "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20" : ""
                                        )}
                                    >
                                        <span className={cn(
                                            "text-xs font-bold",
                                            isSameDay(day, new Date()) ? "bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center -ml-1.5 -mt-1.5 shadow-lg" : "text-muted-foreground"
                                        )}>
                                            {format(day, "d")}
                                        </span>

                                        {hasData ? (
                                            <div className="space-y-1 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-60">
                                                    {isProfit ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" />}
                                                </div>
                                                <p className={cn(
                                                    "text-sm md:text-lg font-black tracking-tight",
                                                    isProfit ? "text-emerald-500" : "text-rose-500"
                                                )}>
                                                    ₹{Math.abs(net).toLocaleString()}
                                                </p>
                                                <p className="text-[9px] uppercase font-bold text-muted-foreground/60 hidden md:block">Net Result</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity">
                                                <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                {hasData && (
                                    <TooltipContent className="glass-card bg-zinc-950/90 border-white/10 p-3 space-y-2">
                                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2 mb-2">
                                            {format(day, "d MMMM yyyy")}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-muted-foreground block text-[9px] uppercase">Revenue</span>
                                                <span className="font-bold">₹{report?.total_sale_gross.toLocaleString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-muted-foreground block text-[9px] uppercase">Expenses</span>
                                                <span className="font-bold text-rose-500">₹{report?.expenses.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )
                })}
            </div>
        </div>
    )
}
