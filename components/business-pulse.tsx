import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, ShoppingBag, ArrowUpRight } from "lucide-react"

interface BusinessPulseProps {
    data: {
        summary: {
            total_sales: number
            total_revenue: number
            total_profit: number
            cash_total: number
            upi_total: number
        }
        topItems: Array<{
            name: string
            qty: number
            amount: number
        }>
    }
}

export function BusinessPulse({ data }: BusinessPulseProps) {
    return (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Daily Business Pulse</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-background/50">Today</Badge>
                </div>
                <CardDescription>Automated summary of today's performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sales</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold">{data.summary.total_sales}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cash</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium">₹</span>
                            <span className="text-xl font-bold">{data.summary.cash_total.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">UPI</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium">₹</span>
                            <span className="text-xl font-bold">{data.summary.upi_total.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Profit</p>
                        <div className="flex items-baseline gap-1 text-emerald-600">
                            <span className="text-sm font-medium">₹</span>
                            <span className="text-xl font-bold">{data.summary.total_profit.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        Top Selling Items
                    </h4>
                    <div className="space-y-2">
                        {data.topItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-2 text-center">No items sold yet today.</p>
                        ) : (
                            data.topItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-background/60 border border-primary/5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-medium truncate">{item.name}</span>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div className="text-[10px] text-muted-foreground">
                                            {item.qty} units
                                        </div>
                                        <div className="text-sm font-bold">
                                            ₹{item.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
