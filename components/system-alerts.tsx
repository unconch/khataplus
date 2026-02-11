"use client"

import { useEffect, useState } from "react"
import { getSystemAlerts, type SystemAlert } from "@/lib/monitoring"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ShieldAlert, Cpu, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function SystemAlerts() {
    const [alerts, setAlerts] = useState<SystemAlert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const data = await getSystemAlerts()
                setAlerts(data)
            } catch (error) {
                console.error("Failed to load alerts", error)
            } finally {
                setLoading(false)
            }
        }
        loadAlerts()
        const interval = setInterval(loadAlerts, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    if (loading && alerts.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">Loading alerts...</div>
    }

    return (
        <Card className="border-red-500/20 bg-red-50/50 dark:bg-red-950/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">System Health & Security</CardTitle>
                </div>
                <CardDescription>
                    Real-time performance and pattern monitoring
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            All systems normal. No active alerts.
                        </div>
                    ) : (
                        alerts.slice(0, 5).map((alert) => (
                            <div
                                key={alert.id}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                            >
                                {alert.type === "performance" ? (
                                    <Cpu className="h-5 w-5 text-amber-500 mt-0.5" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-medium text-sm capitalize">
                                            {alert.type} Alert
                                        </span>
                                        <Badge
                                            variant={
                                                alert.severity === "high"
                                                    ? "destructive"
                                                    : "outline"
                                            }
                                            className="text-[10px] px-1.5 py-0"
                                        >
                                            {alert.severity}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {alert.message}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/60">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
