import { Suspense } from "react"
import { session } from "@descope/nextjs-sdk/server"
import { getCustomer, getKhataTransactions, getCurrentOrgId } from "@/lib/data"
import { KhataLedger } from "@/components/khata-ledger"
import { Loader2 } from "lucide-react"
import { notFound, redirect } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const currSession = await session()
    const userId = (currSession as any)?.token?.sub
    if (!userId) return { title: "Khata" }
    const orgId = await getCurrentOrgId(userId)
    if (!orgId) return { title: "Khata" }

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
    const currSession = await session()
    const userId = (currSession as any)?.token?.sub

    if (!userId) redirect("/auth/login")

    const orgId = await getCurrentOrgId(userId)
    if (!orgId) redirect("/setup-organization")

    const customer = await getCustomer(customerId, orgId)
    if (!customer) notFound()

    const transactions = await getKhataTransactions(orgId, customerId)

    return <KhataLedger customer={customer} transactions={transactions} orgId={orgId} userId={userId} />
}
