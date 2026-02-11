import { getAuditLogs } from "@/lib/data/audit"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Activity, Shield, User } from "lucide-react"

export const metadata = {
    title: "Audit Logs | KhataPlus",
    description: "View system activity and audit trails",
}

export default async function LogsPage() {
    const logs = await getAuditLogs()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        System Audit Logs
                    </h2>
                    <p className="text-muted-foreground">
                        Track all sensitive actions and changes within your organization.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border/50">
                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium">{logs.length} Records Found</span>
                </div>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[200px]">User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} className="group">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span>{log.user_name || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">{log.user_email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-bold bg-background">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-1 rounded">
                                            {log.entity_type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground tabular-nums">
                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
