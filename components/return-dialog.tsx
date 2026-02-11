"use client"

import { useState } from "react"
import type { Sale } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RotateCcw, Loader2 } from "lucide-react"
import { processReturn } from "@/lib/data"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReturnDialogProps {
    sale: Sale
}

export function ReturnDialog({ sale }: ReturnDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [quantity, setQuantity] = useState(0)
    const [reason, setReason] = useState("")
    const router = useRouter()

    const maxQty = sale.quantity
    const refundAmount = (sale.total_amount / sale.quantity) * quantity

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (quantity <= 0 || quantity > maxQty) {
            toast.error("Invalid quantity")
            return
        }

        setLoading(true)
        try {
            await processReturn({
                original_sale_id: sale.id,
                inventory_id: sale.inventory_id,
                quantity,
                refund_amount: refundAmount,
                reason
            }, sale.org_id)

            toast.success("Return processed successfully")
            setOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Failed to process return")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Process Return</DialogTitle>
                    <DialogDescription>
                        Return items for Invoice #{sale.id.slice(0, 8)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Item</Label>
                        <div className="p-3 bg-muted rounded-md text-sm font-medium">
                            {sale.inventory?.name || "Unknown Item"}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Return Qty (Max {maxQty})</Label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={maxQty}
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Refund Amount</Label>
                            <div className="h-10 flex items-center px-3 border rounded-md bg-muted font-bold text-red-500">
                                ₹{refundAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Reason</Label>
                        <Input
                            placeholder="Defective, Wrong Item..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="destructive" disabled={loading || quantity <= 0}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Return"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
