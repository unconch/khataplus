"use client"

import { ShoppingCartIcon, PencilIcon, ClockIcon, CheckIcon, XIcon, Loader2Icon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { updateSale } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Sale } from "@/lib/types"

interface RecentSalesProps {
  sales: Sale[]
  userId: string
}

export function RecentSales({ sales, userId }: RecentSalesProps) {
  const [now, setNow] = useState(Date.now())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const handleUpdate = async (sale: Sale) => {
    if (!userId) return
    setIsSaving(true)
    try {
      const qty = Number.parseInt(editQty)
      if (isNaN(qty) || qty <= 0) throw new Error("Please enter a valid quantity")

      // Calculate new totals based on the original sale price and quantity change
      const price = Number(sale.sale_price)
      const totalAmount = qty * price
      const baseAmount = Number(sale.total_amount) - Number(sale.gst_amount)
      const unitGst = Number(sale.gst_amount) / Number(sale.quantity)
      const gstAmount = unitGst * qty

      // Rough profit re-calc
      const unitProfit = Number(sale.profit) / Number(sale.quantity)
      const profit = unitProfit * qty

      await updateSale(sale.id, {
        quantity: qty,
        total_amount: totalAmount,
        gst_amount: gstAmount,
        profit: profit
      })

      toast.success("Sale updated successfully")
      setEditingId(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to update sale")
    } finally {
      setIsSaving(false)
    }
  }

  if (sales.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ShoppingCartIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No sales recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => {
        const diffMs = now - new Date(sale.created_at).getTime()
        const isEditable = diffMs < 5 * 60 * 1000
        const timeLeftMin = Math.ceil((5 * 60 * 1000 - diffMs) / 1000 / 60)
        const isEditing = editingId === sale.id

        return (
          <Card key={sale.id} className={`overflow-hidden transition-all ${isEditing ? 'ring-2 ring-amber-500' : isEditable ? 'border-amber-500/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{sale.inventory?.name || "Unknown Item"}</p>
                    {isEditable && !isEditing && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">
                        <ClockIcon className="h-2.5 w-2.5" />
                        {timeLeftMin}m left to edit
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        size={1}
                        className="h-8 w-16 text-xs"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground">× ₹{Number(sale.sale_price).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {sale.quantity} × ₹{Number(sale.sale_price).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">₹{Number(sale.total_amount).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(sale.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>

                  {isEditable && (
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-transform"
                            onClick={() => handleUpdate(sale)}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:bg-muted active:scale-95 transition-transform"
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-amber-600 border-amber-200 hover:bg-amber-50 active:scale-95 transition-transform shadow-sm"
                          onClick={() => {
                            setEditingId(sale.id)
                            setEditQty(sale.quantity.toString())
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
