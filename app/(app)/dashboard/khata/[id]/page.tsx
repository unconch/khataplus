import { Suspense } from "react"
import { getCustomer, getKhataTransactions } from "@/lib/data/customers"
import { KhataLedger } from "@/components/khata-ledger"
import { Loader2 } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { resolvePageOrgContext, resolveRequestOrgContext } from "@/lib/server/org-context"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { getCurrentUser } = await import("@/lib/data/auth")
    const { getCustomer } = await import("@/lib/data/customers")
    const user = await getCurrentUser()
    if (!user) {
        return { title: "Khata" }
    }

    let orgId: string | null = null
    try {
        orgId = (await resolveRequestOrgContext()).orgId
    } catch {
        return { title: "Khata" }
    }

    const customer = await getCustomer(id, orgId)
    return {
        title: customer ? `${customer.name} | Khata` : "Khata",
    }
}

export default async function CustomerKhataPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Suspense fallback={
                <div className="flex h-[400px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <KhataContent customerId={id} />
            </Suspense>
        </div>
    )
}

async function KhataContent({ customerId }: { customerId: string }) {
    const { getCurrentUser } = await import("@/lib/data/auth")
    const { getCustomer, getKhataTransactions } = await import("@/lib/data/customers")
    const { getOrganization } = await import("@/lib/data/organizations")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
        return null
    }
    const { userId, isGuest } = user
    const { orgId } = await resolvePageOrgContext()

    const customer = await getCustomer(customerId, orgId)
    if (!customer) {
        notFound()
    }

    const org = isGuest ? { name: "Demo Shop", phone: "9100000000" } : await getOrganization(orgId)
    const transactions = await getKhataTransactions(orgId, customerId)

    return (
        <KhataLedger
            customer={customer}
            transactions={transactions}
            orgId={orgId}
            userId={userId}
            shopName={org?.name || "My Shop"}
        />
    )
}
