"use client"

import { ShoppingCartIcon, PencilIcon, ClockIcon, CheckIcon, XIcon, Loader2Icon, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { updateSale } from "@/lib/data/sales"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Sale } from "@/lib/types"
import { getWhatsAppUrl, WhatsAppMessages } from "@/lib/whatsapp"

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
    if (!userId) {
      return
    }
    setIsSaving(true)
    try {
      const qty = Number.parseInt(editQty)
      if (isNaN(qty) || qty <= 0) {
        throw new Error("Please enter a valid quantity")
      }

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

  const handleMarkAsPaid = async (saleId: string) => {
    setIsSaving(true)
    try {
      await updateSale(saleId, { payment_status: "paid" })
      toast.success("Payment verified and marked as PAID")
      router.refresh()
    } catch (err: any) {
      toast.error("Failed to verify payment")
    } finally {
      setIsSaving(false)
    }
  }

  if (sales.length === 0) {
    return (
      <div className="premium-glass p-8 rounded-[2rem] border-dashed border-border/40 text-center">
        <ShoppingCartIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">No sales recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sales.map((sale) => {
        const diffMs = now - new Date(sale.sale_date).getTime()
        const isEditable = diffMs < 5 * 60 * 1000
        const timeLeftMin = Math.ceil((5 * 60 * 1000 - diffMs) / 1000 / 60)
        const isEditing = editingId === sale.id

        return (
          <div
            key={sale.id}
            className={`premium-glass p-5 rounded-[2rem] transition-all duration-300 border border-white/10 dark:border-white/5 shadow-sm group hover:shadow-xl hover:bg-white/50 dark:hover:bg-zinc-800/50 ${isEditing ? 'ring-2 ring-amber-500/50' : ''
              }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black italic text-lg tracking-tighter text-foreground truncate">
                    {sale.inventory?.name || "Unknown Item"}
                  </p>

                  <div className="flex items-center gap-1.5">
                    {sale.payment_status === "pending" ? (
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        Pending
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Paid
                      </span>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/40 bg-muted/10 px-2 py-0.5 rounded-full border border-border/10">
                      {sale.payment_method}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="h-7 w-16 text-[10px] font-black rounded-lg bg-background/50"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        autoFocus
                      />
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">× ₹{Number(sale.sale_price).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
                      {sale.quantity} Units <span className="mx-1">•</span> ₹{Number(sale.sale_price).toLocaleString("en-IN")} per unit
                    </p>
                  )}
                </div>

                {isEditable && !isEditing && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-amber-500/80 uppercase tracking-widest pt-1">
                    <ClockIcon className="h-2.5 w-2.5" />
                    {timeLeftMin}m remaining to edit
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="text-right space-y-0.5">
                  <p className="text-xl font-black italic tracking-tighter text-foreground">
                    ₹{Number(sale.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                    {new Date(sale.sale_date).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {sale.customer_phone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl premium-glass border-border/10 text-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-90"
                      onClick={() => {
                        const msg = WhatsAppMessages.invoiceShare(
                          sale.customer_name,
                          "My Shop",
                          sale.total_amount,
                          sale.id
                        )
                        window.open(getWhatsAppUrl(sale.customer_phone!, msg), "_blank")
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}

                  {sale.payment_status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-xl premium-glass border-rose-500/30 text-rose-500 font-black text-[9px] uppercase tracking-widest hover:bg-rose-500/10 transition-all active:scale-95"
                      onClick={() => handleMarkAsPaid(sale.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Verify
                    </Button>
                  )}

                  {isEditable && (
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl premium-glass border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => handleUpdate(sale)}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl premium-glass border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl premium-glass border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-all active:scale-90"
                          onClick={() => {
                            setEditingId(sale.id)
                            setEditQty(sale.quantity.toString())
                          }}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
