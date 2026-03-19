import { Suspense } from "react"
import { getSupplier, getSupplierTransactions } from "@/lib/data/suppliers"
import { getCurrentOrgId } from "@/lib/data/auth"
import { SupplierLedger } from "@/components/supplier-ledger"
import { Loader2 } from "lucide-react"
import { notFound, redirect } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getSupplier } = await import("@/lib/data/suppliers")
    const user = await getCurrentUser()
    if (!user) {
        return { title: "Supplier Ledger" }
    }

    let orgId: string | null = null
    if (user.isGuest) {
        orgId = "demo-org"
    } else {
        orgId = await getCurrentOrgId(user.userId)
    }

    if (!orgId) {
        return { title: "Supplier Ledger" }
    }

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
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getSupplier, getSupplierTransactions } = await import("@/lib/data/suppliers")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
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
        redirect("/setup-organization")
        return null
    }

    const supplier = await getSupplier(supplierId, orgId)
    if (!supplier) {
        notFound()
    }

    const transactions = await getSupplierTransactions(orgId, supplierId)

    return <SupplierLedger supplier={supplier} transactions={transactions} orgId={orgId} userId={userId} />
}
