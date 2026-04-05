import { Suspense } from "react"
import { getSuppliers } from "@/lib/data/suppliers"
import { SupplierList } from "@/components/supplier-list"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"
import { resolvePageOrgContext } from "@/lib/server/org-context"

export const metadata = {
    title: "Supplier Management | KhataPlus",
}

export default async function SuppliersPage() {
    const { getCurrentUser } = await import("@/lib/data/auth")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
        return null
    }
    const { userId } = user
    const { orgId } = await resolvePageOrgContext()

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
                    <p className="text-sm text-muted-foreground">Manage your purchases and supplier balances</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex h-[400px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <SupplierContent orgId={orgId} />
            </Suspense>
        </div>
    )
}

async function SupplierContent({ orgId }: { orgId: string }) {
    const suppliers = await getSuppliers(orgId)
    return <SupplierList initialSuppliers={suppliers} orgId={orgId} />
}
