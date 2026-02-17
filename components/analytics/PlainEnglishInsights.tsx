"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, TrendingUp, AlertTriangle, Package } from "lucide-react"

interface PlainEnglishInsightsProps {
    insights: string[]
}

export function PlainEnglishInsights({ insights }: PlainEnglishInsightsProps) {
    const getIcon = (text: string) => {
        if (text.includes("running out") || text.includes("reorder")) return <AlertTriangle className="h-4 w-4 text-red-500" />
        if (text.includes("haven't sold") || text.includes("dead stock")) return <Package className="h-4 w-4 text-zinc-500" />
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
    }

    const getBg = (text: string) => {
        if (text.includes("running out") || text.includes("reorder")) return "bg-red-500/5 border-red-500/10"
        if (text.includes("haven't sold") || text.includes("dead stock")) return "bg-zinc-100/50 border-zinc-200"
        return "bg-emerald-500/5 border-emerald-500/10"
    }

    return (
        <Card className="glass-card overflow-hidden">
            <div className="bg-zinc-950 p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-black text-white italic uppercase tracking-tight">AI Business Insights</h4>
                </div>
                <div className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded uppercase tracking-widest">BETA</div>
            </div>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {insights.length === 0 ? (
                        <p className="col-span-full text-center text-muted-foreground font-medium italic py-4">
                            Your shop is performing cleanly. No critical insights detected yet.
                        </p>
                    ) : insights.map((insight, idx) => (
                        <div key={idx} className={`flex items-start gap-4 p-5 rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${getBg(insight)}`}>
                            <div className="mt-1 p-2 rounded-xl bg-white dark:bg-zinc-950 shadow-sm">
                                {getIcon(insight)}
                            </div>
                            <p className="text-sm font-bold leading-relaxed text-zinc-700 dark:text-zinc-300 italic">
                                "{insight}"
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
