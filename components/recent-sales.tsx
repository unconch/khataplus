"use client"

import { useEffect, useState } from "react"
import { Loader2Icon, MessageCircle, PencilIcon, ShoppingCartIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateSale } from "@/lib/data/sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      if (Number.isNaN(qty) || qty <= 0) throw new Error("Please enter a valid quantity")

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
        profit,
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
    } catch {
      toast.error("Failed to verify payment")
    } finally {
      setIsSaving(false)
    }
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[rgba(15,23,42,0.82)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-[rgba(30,41,59,0.82)] dark:text-zinc-400">
          <ShoppingCartIcon className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-100">No Activity Detected</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Transactions recorded today will appear here</p>
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
        const saleTime = new Date(sale.sale_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

        return (
          <div
            key={sale.id}
            className={cn(
              "group relative overflow-hidden rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-zinc-200 hover:shadow-md dark:border-white/8 dark:bg-[rgba(30,41,59,0.58)]",
              isEditing && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background"
            )}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className={cn("absolute left-0 top-0 h-full w-1.5", isPaid ? "bg-emerald-500" : "bg-amber-500")} />

            <div className="grid gap-5 pl-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
              <div className="flex min-w-0 gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border",
                    isPaid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                  )}
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="truncate text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                      {sale.inventory?.name || "Inventory Asset"}
                    </h4>
                    <div
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      )}
                    >
                      {isPaid ? "Settled" : "Unsettled"}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800/80">{sale.quantity} units</span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800/80">Rs {Number(sale.sale_price).toLocaleString("en-IN")} /ea</span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800/80">{sale.payment_method || "Cash"}</span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800/80">{saleTime}</span>
                  </div>

                  {isEditing && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-white/8">
                      <Input
                        type="number"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        className="h-10 w-28 rounded-xl border-emerald-100 bg-emerald-50/10 text-sm font-black focus-visible:ring-emerald-500 dark:border-emerald-400/20 dark:bg-[rgba(16,185,129,0.08)]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-10 rounded-xl bg-emerald-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-500"
                          onClick={() => handleUpdate(sale)}
                        >
                          {isSaving ? <Loader2Icon className="h-3 w-3 animate-spin" /> : "Commit"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest dark:border-white/8"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-zinc-100 bg-zinc-50/70 p-4 dark:border-white/8 dark:bg-[rgba(15,23,42,0.55)]">
                <div className="space-y-1 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Total Value</div>
                  <div className={cn("text-3xl font-black tracking-tight", isPaid ? "text-zinc-950 dark:text-zinc-100" : "text-amber-600 dark:text-amber-400")}>
                    Rs {Number(sale.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {!isPaid && (
                    <Button
                      size="sm"
                      className="h-10 rounded-xl bg-amber-500 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-amber-400"
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
                      className="h-10 w-10 rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
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
                      className="h-10 w-10 rounded-xl border border-zinc-100 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/8 dark:text-zinc-300 dark:hover:bg-[rgba(30,41,59,0.8)] dark:hover:text-white"
                      onClick={() => {
                        setEditingId(sale.id)
                        setEditQty(sale.quantity.toString())
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
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
