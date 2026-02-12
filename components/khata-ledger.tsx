"use client"

import { useState } from "react"
import { Customer, KhataTransaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, Plus, Minus, Calendar, Info, Share2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"

interface KhataLedgerProps {
    customer: Customer
    transactions: KhataTransaction[]
    orgId: string
    userId: string
}

export function KhataLedger({ customer, transactions: initialTransactions, orgId, userId }: KhataLedgerProps) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [balance, setBalance] = useState(customer.balance || 0)

    const handleSuccess = (newTx: KhataTransaction) => {
        setTransactions([newTx, ...transactions])
        const amount = Number(newTx.amount)
        setBalance(prev => newTx.type === "credit" ? prev + amount : prev - amount)
    }

    const shareOnWhatsApp = () => {
        const text = `*Balance Summary from ${customer.name}'s Ledger*\n\n` +
            `Total Balance: *₹${Math.abs(balance).toLocaleString()}*\n` +
            `Status: *${balance >= 0 ? "Pending Payment" : "Advance Paid"}*\n\n` +
            `_Managed via KhataPlus - Your Digital Shop Assistant_\n` +
            `https://khataplus.online?ref=remind`

        window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(text)}`, "_blank")
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Balance Card */}
            <Card className={cn(
                "border-none shadow-lg overflow-hidden",
                balance >= 0 ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-rose-500 to-orange-600"
            )}>
                <CardContent className="p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/80 font-medium uppercase tracking-wider text-xs mb-1">Current Balance</p>
                            <h2 className="text-4xl font-bold flex items-center">
                                <IndianRupee className="h-8 w-8" />
                                {Math.abs(balance).toLocaleString()}
                            </h2>
                            <p className="mt-2 text-white/90 font-medium italic">
                                {balance >= 0 ? "You'll Get (Credit)" : "You'll Give (Advance)"}
                            </p>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl">
                            {customer.name[0].toUpperCase()}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button onClick={shareOnWhatsApp} className="w-full sm:flex-1 h-12 rounded-2xl gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                    <MessageSquare className="h-4 w-4" />
                    Share on WhatsApp
                </Button>
                <Button variant="outline" className="w-full sm:flex-1 h-12 rounded-2xl gap-2 border-2 border-zinc-100 dark:border-white/5 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                    <Share2 className="h-4 w-4 text-blue-500" />
                    Download PDF
                </Button>
            </div>

            {/* Transactions Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Transaction History</h3>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border-b border-muted">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center",
                                    tx.type === "credit" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                )}>
                                    {tx.type === "credit" ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">
                                        {tx.type === "credit" ? "Credit (Given)" : "Payment (Received)"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        {new Date(tx.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {tx.note && <p className="text-[10px] text-muted-foreground mt-0.5 italic flex items-center gap-1">
                                        <Info className="h-2 w-2" /> {tx.note}
                                    </p>}
                                </div>
                            </div>
                            <div className={cn(
                                "font-bold text-lg",
                                tx.type === "credit" ? "text-rose-500" : "text-emerald-500"
                            )}>
                                {tx.type === "credit" ? "-" : "+"}
                                <IndianRupee className="inline h-4 w-4 -mt-1 ml-0.5" />
                                {Number(tx.amount).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-20 left-4 right-4 flex gap-4 z-40 bg-background/80 backdrop-blur-md p-2 rounded-2xl border shadow-xl">
                <AddTransactionDialog
                    type="payment"
                    customerId={customer.id}
                    customerName={customer.name}
                    orgId={orgId}
                    userId={userId}
                    onSuccess={handleSuccess}
                />
                <AddTransactionDialog
                    type="credit"
                    customerId={customer.id}
                    customerName={customer.name}
                    orgId={orgId}
                    userId={userId}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    )
}
