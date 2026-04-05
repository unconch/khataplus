import { Suspense } from "react"
import { getCustomers } from "@/lib/data/customers"
import { CustomerList } from "@/components/customer-list"
import { Loader2 } from "lucide-react"
import { resolvePageOrgContext } from "@/lib/server/org-context"

export const metadata = {
    title: "Customers | KhataPlus",
}

export default async function CustomersPage() {
    return (
        <div className="min-h-full space-y-10 pb-20">
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
    const { getCurrentUser } = await import("@/lib/data/auth")
    const { getCustomers } = await import("@/lib/data/customers")
    const user = await getCurrentUser()

    if (!user) {
        return null
    }
    const { orgId } = await resolvePageOrgContext()

    const customers = await getCustomers(orgId)

    return <CustomerList customers={customers} orgId={orgId} />
}
