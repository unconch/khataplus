"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react"

interface StockHealthItem {
    id: string
    name: string
    stock: number
    daysLeft: number | null
    status: 'Healthy' | 'Watch' | 'Reorder Now' | 'Dead Stock'
}

interface StockHealthTableProps {
    data: StockHealthItem[]
}

export function StockHealthTable({ data }: StockHealthTableProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Reorder Now': return <AlertTriangle className="h-4 w-4 text-red-500" />
            case 'Watch': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'Dead Stock': return <MinusCircle className="h-4 w-4 text-zinc-400" />
            case 'Healthy': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            default: return null
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Reorder Now': return "bg-red-500/10 text-red-600 border-red-200"
            case 'Watch': return "bg-yellow-500/10 text-yellow-600 border-yellow-200"
            case 'Dead Stock': return "bg-zinc-100 text-zinc-500 border-zinc-200"
            case 'Healthy': return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
            default: return ""
        }
    }

    return (
        <Card className="glass-card h-full">
            <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black tracking-tight italic">Stock Health Dashboard</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">AI-driven inventory longevity audit</CardDescription>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                        <Package className="h-4 w-4 text-primary" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Item</th>
                                <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Stock</th>
                                <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Days Left</th>
                                <th className="text-center py-4 px-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-muted-foreground font-medium italic">
                                        No sufficient data for predictions yet.
                                    </td>
                                </tr>
                            ) : data.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                                    <td className="py-4 px-6 text-right font-black tracking-tighter text-base">{item.stock}</td>
                                    <td className="py-4 px-6 text-right font-bold text-zinc-500">
                                        {item.daysLeft !== null ? `${item.daysLeft} days` : "—"}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${getStatusColor(item.status)}`}>
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(item.status)}
                                                {item.status}
                                            </div>
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
