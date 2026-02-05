import { Suspense } from "react"
import { session } from "@descope/nextjs-sdk/server"
import { getKhataTransactions, getCurrentOrgId, getCustomers } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, ArrowUpRight, ArrowDownLeft, Loader2, Users, Receipt } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = {
    title: "Khata Dashboard | KhataPlus",
}

export default async function KhataDashboardPage() {
    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-24">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Khata Ledger</h2>
            </div>

            <Suspense fallback={
                <div className="flex h-[400px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <KhataDashboardContent />
            </Suspense>
        </div>
    )
}

async function KhataDashboardContent() {
    const currSession = await session()
    const userId = (currSession as any)?.token?.sub
    if (!userId) return null

    const orgId = await getCurrentOrgId(userId)
    if (!orgId) return null

    const [transactions, customers] = await Promise.all([
        getKhataTransactions(orgId),
        getCustomers(orgId)
    ])

    const totalGet = customers.reduce((acc, c) => (c.balance || 0) > 0 ? acc + (c.balance || 0) : acc, 0)
    const totalGive = customers.reduce((acc, c) => (c.balance || 0) < 0 ? acc + Math.abs(c.balance || 0) : acc, 0)

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-none bg-emerald-50 shadow-sm dark:bg-emerald-500/10">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                            <ArrowDownLeft className="h-4 w-4" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">You'll Get</span>
                        </div>
                        <div className="flex items-center text-xl font-bold text-emerald-700 dark:text-emerald-400">
                            <IndianRupee className="h-4 w-4" />
                            {totalGet.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none bg-rose-50 shadow-sm dark:bg-rose-500/10">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                            <ArrowUpRight className="h-4 w-4" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">You'll Give</span>
                        </div>
                        <div className="flex items-center text-xl font-bold text-rose-700 dark:text-rose-400">
                            <IndianRupee className="h-4 w-4" />
                            {totalGive.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/dashboard/customers" className="block">
                    <Card className="hover:bg-muted/50 transition-colors border-none shadow-sm bg-muted/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Total Parties</p>
                                <p className="text-lg font-bold">{customers.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Card className="border-none shadow-sm bg-muted/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600">
                            <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Entries</p>
                            <p className="text-lg font-bold">{transactions.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold px-1">Recent Transactions</h3>
                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                            <p className="text-muted-foreground">No recent entries</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <Link key={tx.id} href={`/dashboard/khata/${tx.customer_id}`} className="block">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border-l-4 border-l-transparent hover:border-l-primary transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center font-bold text-white",
                                            tx.type === "credit" ? "bg-rose-500" : "bg-emerald-500"
                                        )}>
                                            {tx.customer?.name?.[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{tx.customer?.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                {new Date(tx.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} •
                                                {tx.type === "credit" ? " GAVE" : " GOT"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "font-bold text-lg",
                                        tx.type === "credit" ? "text-rose-500" : "text-emerald-500"
                                    )}>
                                        <IndianRupee className="inline h-4 w-4 -mt-1 ml-0.5" />
                                        {Number(tx.amount).toLocaleString()}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
