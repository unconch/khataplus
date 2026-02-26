"use client"

import { ShoppingCartIcon, PencilIcon, ClockIcon, CheckIcon, XIcon, Loader2Icon, MessageCircle, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { updateSale } from "@/lib/data/sales"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Sale } from "@/lib/types"
import { getWhatsAppUrl, WhatsAppMessages } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"

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

      const price = Number(sale.sale_price)
      const totalAmount = qty * price
      const unitGst = Number(sale.gst_amount) / Number(sale.quantity)
      const gstAmount = unitGst * qty
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
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-white/10 text-center flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-500">
          <ShoppingCartIcon className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-100">No Activity Detected</p>
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Transactions recorded today will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {sales.map((sale, idx) => {
        const diffMs = now - new Date(sale.sale_date).getTime()
        const isEditable = diffMs < 5 * 60 * 1000
        const isEditing = editingId === sale.id
        const isPaid = sale.payment_status !== "pending"

        return (
          <div
            key={sale.id}
            className={cn(
              "group relative flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2",
              isEditing && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background"
            )}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {/* Precision Status Bar */}
            <div className={cn(
              "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-500 group-hover:top-0 group-hover:bottom-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
              isPaid ? "bg-emerald-500" : "bg-amber-500"
            )} />

            <div className="flex flex-1 items-center gap-4 w-full sm:pl-3">
              {/* Institutional Icon */}
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                isPaid
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              )}>
                <ShoppingCartIcon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-[15px] font-black italic tracking-tighter text-zinc-950 dark:text-zinc-50 truncate uppercase">
                    {sale.inventory?.name || "Inventory Asset"}
                  </h4>
                  {isPaid ? (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-[0.1em]">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      Captured
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-[0.1em]">
                      <div className="h-1 w-1 rounded-full bg-amber-500 animate-bounce" />
                      Unsettled
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-950 dark:text-zinc-200">{sale.quantity} Units</span>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <span className="text-zinc-500">₹{Number(sale.sale_price).toLocaleString()} /ea</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-zinc-300 dark:text-zinc-700">
                    <span className="h-1 w-5 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
                    <span className="text-zinc-400">{sale.payment_method || "CASH"}</span>
                    <span className="text-zinc-500">{new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 pt-3">
                    <Input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      className="h-10 w-24 rounded-xl border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/10 text-sm font-black focus-visible:ring-emerald-500"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-10 rounded-xl px-5 bg-emerald-600 hover:bg-emerald-500 font-black text-white text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/10"
                        onClick={() => handleUpdate(sale)}
                      >
                        {isSaving ? <Loader2Icon className="h-3 w-3 animate-spin" /> : "Commit"}
                      </Button>
                      <Button variant="outline" size="sm" className="h-10 rounded-xl px-5 border-zinc-100 dark:border-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Value & Intelligence Actions */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto sm:border-l border-zinc-100 dark:border-white/5 sm:pl-6">
              <div className="text-left sm:text-right group-hover/bill:translate-x-[-4px] transition-transform duration-500">
                <p className={cn(
                  "text-2xl font-black italic tracking-tighter leading-none flex items-center gap-1.5 justify-end",
                  isPaid ? "text-zinc-950 dark:text-zinc-100" : "text-amber-600 dark:text-amber-500"
                )}>
                  <span className="text-xs italic text-zinc-400 dark:text-zinc-600">₹</span>
                  {Number(sale.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1.5 opacity-60">Settled Value</p>
              </div>

              <div className="flex items-center gap-2">
                {!isPaid && (
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 border-none animate-pulse"
                    onClick={() => handleMarkAsPaid(sale.id)}
                    disabled={isSaving}
                  >
                    Settle
                  </Button>
                )}

                {sale.customer_phone && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-emerald-100 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 shadow-sm"
                    onClick={() => {
                      const msg = WhatsAppMessages.invoiceShare(sale.customer_name, "Business", sale.total_amount, sale.id)
                      window.open(getWhatsAppUrl(sale.customer_phone!, msg), "_blank")
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}

                {isEditable && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    onClick={() => {
                      setEditingId(sale.id)
                      setEditQty(sale.quantity.toString())
                    }}
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
