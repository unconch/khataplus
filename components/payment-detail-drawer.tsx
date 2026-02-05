
"use client"

import { useMemo } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { format, parseISO, startOfWeek } from "date-fns"
import { DailyReport } from "@/lib/types"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface PaymentDetailDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    type: "Cash" | "Online" | null
    reports: DailyReport[]
}

export function PaymentDetailDrawer({ isOpen, onOpenChange, type, reports }: PaymentDetailDrawerProps) {
    // Hooks must always run. 
    // We provide safe defaults if type is null.

    const weeklyData = useMemo(() => {
        if (!type || !reports) return []

        const weeks: { [key: string]: { name: string; value: number } } = {}

        reports.forEach(report => {
            const date = parseISO(report.report_date)
            const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday start
            const weekLabel = `${format(weekStart, "d MMM")}`

            if (!weeks[weekLabel]) {
                weeks[weekLabel] = { name: weekLabel, value: 0 }
            }
            weeks[weekLabel].value += type === "Cash" ? report.cash_sale : report.online_sale
        })

        return Object.values(weeks).reverse() // Chronological
    }, [reports, type])

    const dailyList = useMemo(() => {
        if (!type || !reports) return []

        return reports
            .map(r => ({
                date: r.report_date,
                amount: type === "Cash" ? r.cash_sale : r.online_sale,
                total: r.total_sale_gross
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
    }, [reports, type])

    const totalAmount = dailyList.reduce((sum, item) => sum + item.amount, 0)

    // Style variables - safe to compute even if type is null (will just be default)
    const highlightColor = type === "Online" ? "#3b82f6" : "#10b981" // Default to green
    const bgClass = type === "Online" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"

    // IMPORTANT: Always render the Drawer root. Do not return null.
    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh] glass-card bg-zinc-950/95 border-t border-white/10 text-foreground">
                <VisuallyHidden>
                    <DrawerTitle>{type ? `${type} Collection Details` : "Collection Details"}</DrawerTitle>
                    <DrawerDescription>Detailed breakdown of daily and weekly collections.</DrawerDescription>
                </VisuallyHidden>
                {type && (
                    <>
                        <DrawerHeader className="border-b border-white/5 pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DrawerTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
                                        {type} Collection
                                        <Badge variant="outline" className={`text-sm py-1 px-3 border-0 ${bgClass}`}>
                                            Total: ₹{totalAmount.toLocaleString()}
                                        </Badge>
                                    </DrawerTitle>
                                    <DrawerDescription className="text-muted-foreground font-bold mt-1">
                                        Weekly breakdown & daily ledger
                                    </DrawerDescription>
                                </div>
                            </div>
                        </DrawerHeader>

                        <div className="p-6 overflow-y-auto space-y-8 pb-20">

                            {/* Weekly Chart */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Weekly Performance</h3>
                                <div className="h-[250px] w-full bg-white/5 rounded-3xl p-4 border border-white/5">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyData}>
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: "#71717a", fontSize: 10, fontWeight: "bold" }}
                                                dy={10}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                                formatter={(val: number) => [`₹${val.toLocaleString()}`, "Collected"]}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {weeklyData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={highlightColor} fillOpacity={0.8} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Daily Ledger */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Daily Breakdown</h3>
                                <div className="space-y-3">
                                    {dailyList.map((item) => (
                                        <div key={item.date} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bgClass}`}>
                                                    <span className="font-black text-lg">₹</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm tracking-tight">{format(parseISO(item.date), "dd MMMM, yyyy")}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{format(parseISO(item.date), "EEEE")}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-lg tracking-tight">₹{item.amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    {Math.round((item.amount / (item.total || 1)) * 100)}% of Daily Sales
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <DrawerFooter className="bg-zinc-950/50 border-t border-white/5">
                    <DrawerClose asChild>
                        <Button variant="outline" className="h-12 rounded-xl font-bold uppercase tracking-widest">Close View</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
