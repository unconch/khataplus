"use client"

import { AuditLog } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import {
    PackageIcon,
    ShoppingCartIcon,
    UserCogIcon,
    SettingsIcon,
    HistoryIcon
} from "lucide-react"

interface ActivityLogsProps {
    logs: AuditLog[]
}

export function ActivityLogs({ logs }: ActivityLogsProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case "inventory": return <PackageIcon className="h-4 w-4" />
            case "sale": return <ShoppingCartIcon className="h-4 w-4" />
            case "user": return <UserCogIcon className="h-4 w-4" />
            case "settings": return <SettingsIcon className="h-4 w-4" />
            default: return <HistoryIcon className="h-4 w-4" />
        }
    }

    const getActionColor = (action: string) => {
        if (action.includes("Added")) return "bg-green-500/10 text-green-500 border-green-500/20"
        if (action.includes("Sale")) return "bg-blue-500/10 text-blue-500 border-blue-500/20"
        if (action.includes("Status") || action.includes("Role")) return "bg-purple-500/10 text-purple-500 border-purple-500/20"
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card/50">
                <HistoryIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-medium">No activity yet</h3>
                <p className="text-sm text-muted-foreground">Significant actions will appear here once they occur.</p>
            </div>
        )
    }

    return (
        <div className="max-h-[500px] w-full rounded-md border p-4 bg-card/50 overflow-y-auto">
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-4 p-3 rounded-lg border bg-background/50 items-start">
                        <div className={`mt-1 p-2 rounded-full border ${getActionColor(log.action)}`}>
                            {getIcon(log.entity_type)}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{log.action}</span>
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground block">
                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/60 block tabular-nums">
                                        {new Date(log.created_at).toLocaleString("en-IN", {
                                            timeZone: "Asia/Kolkata",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                            hour12: true
                                        })} IST
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{log.user_email}</span>
                                {log.details && (
                                    <span className="ml-1">
                                        — {Object.entries(log.details).map(([key, val]) => (
                                            <span key={key} className="italic text-xs">
                                                {key}: <span className="text-foreground not-italic">{JSON.stringify(val)}</span>
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
