import { Suspense } from "react"
import { getCustomers } from "@/lib/data/customers"
import { getCurrentOrgId } from "@/lib/data/auth"
import { CustomerList } from "@/components/customer-list"
import { Loader2 } from "lucide-react"

export const metadata = {
    title: "Customers | KhataPlus",
}

export default async function CustomersPage() {
    return (
        <div className="min-h-full space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                        Credit <span className="text-emerald-600">Ledger</span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">Manage your customers and outstanding balances</p>
                </div>
            </div>
            <Suspense fallback={
                <div className="h-[600px] w-full flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl animate-pulse border">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground/20" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Opening Ledger</p>
                    </div>
                </div>
            }>
                <CustomersContent />
            </Suspense>
        </div>
    )
}

async function CustomersContent() {
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getCustomers } = await import("@/lib/data/customers")
    const user = await getCurrentUser()

    if (!user) {
        return null
    }
    const { userId, isGuest } = user

    let orgId: string | null = null
    if (isGuest) {
        orgId = "demo-org"
    } else {
        orgId = await getCurrentOrgId(userId)
    }

    if (!orgId) {
        return null
    }

    const customers = await getCustomers(orgId)

    return <CustomerList customers={customers} orgId={orgId} />
}
