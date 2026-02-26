"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, PackageOpen, DollarSign, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryStatsProps {
    data: {
        totalValue: number
        totalSkus: number
        lowStock: number
    }
}

export function InventoryStats({ data }: InventoryStatsProps) {
    return (
        <Card className="bg-card dark:bg-zinc-900/50 border-zinc-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md animate-in fade-in scale-in duration-500">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold tracking-tight">Inventory Health</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Real-time stock analytics</CardDescription>
                    </div>
                    <PackageOpen className="h-5 w-5 text-emerald-500" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest leading-none mb-1">Total Stock Value</p>
                            <h3 className="text-2xl font-bold tracking-tight">₹{data.totalValue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1.5">Stock Variety</p>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">{data.totalSkus}</span>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase">SKUs</span>
                        </div>
                    </div>
                    <div className={cn(
                        "p-3 rounded-xl border transition-all",
                        data.lowStock > 0
                            ? "border-orange-200 bg-orange-50/50 dark:border-orange-500/20 dark:bg-orange-500/10"
                            : "border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30"
                    )}>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1.5">Shortage Risk</p>
                        <div className="flex items-center justify-between">
                            <span className={cn("text-lg font-bold", data.lowStock > 0 ? "text-orange-600 dark:text-orange-400" : "")}>{data.lowStock}</span>
                            {data.lowStock > 0 && <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />}
                        </div>
                    </div>
                </div>

                {data.lowStock > 0 && (
                    <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-lg hover:scale-[1.02] transition-all cursor-default">
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Action Required</p>
                            <p className="text-[10px] font-bold uppercase tracking-tight">{data.lowStock} items need restocking</p>
                        </div>
                        <ArrowRight size={14} className="opacity-50" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
