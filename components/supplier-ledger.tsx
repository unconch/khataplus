"use client"

import { useState } from "react"
import { Supplier, SupplierTransaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IndianRupee, Plus, Minus, Calendar, Info, Phone, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddSupplierTransactionDialog } from "@/components/add-supplier-transaction-dialog"

interface SupplierLedgerProps {
    supplier: Supplier
    transactions: SupplierTransaction[]
    orgId: string
    userId: string
}

export function SupplierLedger({ supplier, transactions: initialTransactions, orgId, userId }: SupplierLedgerProps) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [balance, setBalance] = useState(supplier.balance || 0)

    const handleSuccess = (newTx: SupplierTransaction) => {
        setTransactions([newTx, ...transactions])
        const amount = Number(newTx.amount)
        setBalance(prev => newTx.type === "purchase" ? prev + amount : prev - amount)
    }

    return (
        <div className="space-y-6 pb-[calc(env(safe-area-inset-bottom)+10rem)] md:pb-28">
            {/* Balance Card */}
            <Card className={cn(
                "border-none shadow-lg overflow-hidden",
                balance >= 0 ? "bg-gradient-to-br from-rose-500 to-orange-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
            )}>
                <CardContent className="p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/80 font-medium uppercase tracking-wider text-xs mb-1">Total Due</p>
                            <h2 className="text-4xl font-bold flex items-center">
                                <IndianRupee className="h-8 w-8" />
                                {Math.abs(balance).toLocaleString()}
                            </h2>
                            <p className="mt-2 text-white/90 font-medium italic">
                                {balance >= 0 ? "You'll Give (Credit)" : "Purchase (Advance)"}
                            </p>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl uppercase">
                            {supplier.name[0]}
                        </div>
                    </div>
                    {supplier.phone && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-white/80">
                            <Phone className="h-4 w-4" />
                            {supplier.phone}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transactions Header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold">Purchase History</h3>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No purchases yet</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="rounded-xl bg-muted/20 border-b border-muted p-4">
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "h-11 w-11 rounded-full flex items-center justify-center shrink-0",
                                    tx.type === "purchase" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                )}>
                                    {tx.type === "purchase" ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm">
                                        {tx.type === "purchase" ? "Purchase (Unpaid)" : "Payment (Sent)"}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {new Date(tx.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {tx.note && <p className="mt-1 flex items-center gap-1 text-xs italic text-muted-foreground">
                                        <Info className="h-3 w-3 shrink-0" /> <span className="truncate">{tx.note}</span>
                                    </p>}
                                </div>
                            </div>
                            <div className={cn(
                                "mt-3 pl-14 text-right font-bold text-lg md:mt-0 md:pl-0",
                                tx.type === "purchase" ? "text-rose-500" : "text-emerald-500"
                            )}>
                                {tx.type === "purchase" ? "-" : "+"}
                                <IndianRupee className="inline h-4 w-4 -mt-1 ml-0.5" />
                                {Number(tx.amount).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-0 left-4 right-4 z-40 flex flex-col gap-3 rounded-2xl border bg-background/80 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md shadow-xl md:bottom-20 md:flex-row md:gap-4 md:p-2 md:pb-2">
                <AddSupplierTransactionDialog
                    type="payment"
                    supplierId={supplier.id}
                    supplierName={supplier.name}
                    orgId={orgId}
                    userId={userId}
                    onSuccess={handleSuccess}
                />
                <AddSupplierTransactionDialog
                    type="purchase"
                    supplierId={supplier.id}
                    supplierName={supplier.name}
                    orgId={orgId}
                    userId={userId}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    )
}
