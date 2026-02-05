import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, ArrowRight, PackageOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InventoryStatsProps {
    data: {
        totalValue: number
        totalSkus: number
        lowStock: number
    }
}

export function InventoryStats({ data }: InventoryStatsProps) {
    return (
        <Card className="glass-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Inventory Health</CardTitle>
                        <CardDescription>Stock levels and valuation</CardDescription>
                    </div>
                    <PackageOpen className="h-5 w-5 text-orange-500" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/5">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Working Capital</p>
                        <h3 className="text-2xl font-bold">₹{data.totalValue.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Stock Variety</p>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">{data.totalSkus}</span>
                            <span className="text-[10px] text-muted-foreground">Unique items</span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${data.lowStock > 0 ? 'border-orange-200 bg-orange-50/50' : 'border-border/50 bg-background/50'}`}>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Shortage Risk</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold ${data.lowStock > 0 ? 'text-orange-600' : ''}`}>{data.lowStock}</span>
                            {data.lowStock > 0 && <AlertCircle className="h-4 w-4 text-orange-600" />}
                        </div>
                    </div>
                </div>

                {data.lowStock > 0 && (
                    <div className="flex items-center justify-between p-2 px-3 rounded-md bg-orange-100/30 text-orange-800 dark:text-orange-200">
                        <span className="text-xs font-medium">{data.lowStock} items require restock</span>
                        <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-700 bg-white">Action Needed</Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

import { DollarSign } from "lucide-react"
