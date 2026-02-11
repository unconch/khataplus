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
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
            </div>
            <Suspense fallback={
                <div className="flex h-[400px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
