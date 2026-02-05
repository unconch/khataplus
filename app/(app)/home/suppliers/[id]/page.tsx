import { Suspense } from "react"
import { session } from "@descope/nextjs-sdk/server"
import { getSupplier, getSupplierTransactions, getCurrentOrgId } from "@/lib/data"
import { SupplierLedger } from "@/components/supplier-ledger"
import { Loader2 } from "lucide-react"
import { notFound, redirect } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const currSession = await session()
    const userId = (currSession as any)?.token?.sub
    if (!userId) return { title: "Supplier Ledger" }
    const orgId = await getCurrentOrgId(userId)
    if (!orgId) return { title: "Supplier Ledger" }

    const supplier = await getSupplier(id, orgId)
    return {
        title: supplier ? `${supplier.name} | Supplier Ledger` : "Supplier Ledger",
    }
}

export default async function SupplierLedgerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Suspense fallback={
                <div className="flex h-[400px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <LedgerContent supplierId={id} />
            </Suspense>
        </div>
    )
}

async function LedgerContent({ supplierId }: { supplierId: string }) {
    const currSession = await session()
    const userId = (currSession as any)?.token?.sub

    if (!userId) redirect("/auth/login")

    const orgId = await getCurrentOrgId(userId)
    if (!orgId) redirect("/setup-organization")

    const supplier = await getSupplier(supplierId, orgId)
    if (!supplier) notFound()

    const transactions = await getSupplierTransactions(orgId, supplierId)

    return <SupplierLedger supplier={supplier} transactions={transactions} orgId={orgId} userId={userId} />
}
