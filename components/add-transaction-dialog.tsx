"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Minus, Loader2, IndianRupee } from "lucide-react"
import { KhataTransaction } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AddTransactionDialogProps {
    type: "credit" | "payment"
    customerId: string
    customerName: string
    orgId: string
    userId: string
    onSuccess?: (tx: KhataTransaction) => void
}

export function AddTransactionDialog({ type, customerId, customerName, orgId, userId, onSuccess }: AddTransactionDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState("")
    const [note, setNote] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          return
        }

        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/khata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId,
                    type,
                    amount: Number(amount),
                    note,
                    orgId,
                    userId
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to record transaction")
            }

            const newTx = await res.json()
            onSuccess?.(newTx)
            setOpen(false)
            setAmount("")
            setNote("")
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const isCredit = type === "credit"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className={cn(
                        "flex-1 gap-2 h-12 text-lg font-bold rounded-xl shadow-lg",
                        isCredit ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"
                    )}
                >
                    {isCredit ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {isCredit ? "You Gave" : "You Got"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className={isCredit ? "text-rose-600" : "text-emerald-600"}>
                            {isCredit ? "Credit Given to" : "Payment Received from"} {customerName}
                        </DialogTitle>
                        <DialogDescription>
                            Enter the amount and details for this transaction
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="amount" className="text-lg">Amount (₹)</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="amount"
                                    type="number"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-10 text-2xl h-14 font-bold"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="note">Note (Optional)</Label>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. For grocery, Pending balance, etc."
                                className="resize-none"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-12 flex-1">Cancel</Button>
                        <Button
                            type="submit"
                            className={cn("h-12 flex-1", isCredit ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600")}
                            disabled={loading || !amount || Number(amount) <= 0}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : `Save ${isCredit ? 'Credit' : 'Payment'}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
