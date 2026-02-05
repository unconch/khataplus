import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface StaffLeaderboardProps {
    data: Array<{
        name: string
        sales: number
        revenue: number
    }>
}

export function StaffLeaderboard({ data }: StaffLeaderboardProps) {
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

    return (
        <div className="space-y-6">
            {data.map((staff, idx) => (
                <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-primary/10">
                                <AvatarFallback className="text-[10px] bg-primary/5">
                                    {staff.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid gap-0.5">
                                <p className="text-sm font-medium leading-none">{staff.name}</p>
                                <p className="text-xs text-muted-foreground">{staff.sales} transactions</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">₹{staff.revenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <Progress value={(staff.revenue / maxRevenue) * 100} className="h-1.5 bg-primary/5" />
                </div>
            ))}
            {data.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-8">No staff activity recorded yet.</p>
            )}
        </div>
    )
}
