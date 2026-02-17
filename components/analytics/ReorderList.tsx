"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, ShoppingCart } from "lucide-react"

interface ReorderItem {
    id: string
    name: string
    currentStock: number
    suggestedQty: number
    daysLeft: number | null
}

interface ReorderListProps {
    data: ReorderItem[]
}

export function ReorderList({ data }: ReorderListProps) {
    return (
        <Card className="glass-card h-full">
            <CardHeader className="pb-3 px-6 pt-6 text-center">
                <div className="mx-auto h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-3">
                    <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight italic">Weekly Reorder List</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Based on last 30 days trailing sales</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {data.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground font-medium italic">
                            All stock levels are healthy.
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {data.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all group">
                                        <div>
                                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.name}</p>
                                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-0.5">
                                                {item.daysLeft === 0 ? "OUT OF STOCK" : `${item.daysLeft} days till stockout`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black tracking-tighter text-zinc-950 dark:text-white">+{item.suggestedQty}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Suggested</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800 shadow-xl shadow-zinc-950/10 mt-4">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Generate Purchase Order
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
