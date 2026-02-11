"use client"

import { useState, useMemo } from "react"
import type { Sale } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileTextIcon, Printer, Download, Loader2, Package2, Search, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ReturnDialog } from "./return-dialog"
import { generateInvoice, type GroupedSale } from "@/lib/invoice-utils"

interface GstBillsProps {
  sales: Sale[]
  org?: { name: string; gstin?: string }
}

export function GstBills({ sales, org }: GstBillsProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Group sales by batch_id if present, otherwise treat as individual batches
  const groupedSales = useMemo(() => {
    return sales.reduce((acc, sale) => {
      const key = sale.batch_id || sale.id
      if (!acc[key]) {
        acc[key] = {
          id: key,
          userId: sale.user_id,
          createdat: sale.created_at,
          saledate: sale.sale_date,
          paymentMethod: sale.payment_method,
          items: []
        }
      }
      acc[key].items.push(sale)
      return acc
    }, {} as Record<string, GroupedSale>)
  }, [sales])

  const filteredGroups = useMemo(() => {
    const sorted = Object.values(groupedSales).sort((a, b) =>
      new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
    )

    if (!searchQuery) {
      return sorted
    }

    const query = searchQuery.toLowerCase()
    return sorted.filter(group => {
      const billId = `INV-${format(new Date(group.createdat), "ddMMyyHHmm")}`
      const matchesId = billId.toLowerCase().includes(query)
      const matchesItem = group.items.some(item => item.inventory?.name.toLowerCase().includes(query))
      const totalAmount = group.items.reduce((sum, item) => sum + item.total_amount, 0)
      const matchesAmount = totalAmount.toString().includes(query)

      return matchesId || matchesItem || matchesAmount
    })
  }, [groupedSales, searchQuery])

  const handleDownload = async (group: GroupedSale, type: 'A4' | 'THERMAL') => {
    setGeneratingId(`${group.id}-${type}`)
    try {
      await generateInvoice(group, type, org)
    } catch (err) {
      alert("Failed to generate invoice")
    } finally {
      setGeneratingId(null)
    }
  }

  if (Object.keys(groupedSales).length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileTextIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">No invoice history</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Grouped sales will appear here automatically</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative group sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-2 -mx-4 px-4">
        <Search className="absolute left-7 top-[calc(50%-4px)] -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by Bill ID, Item or Amount..."
          className="pl-11 h-12 bg-muted/20 border-zinc-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredGroups.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-muted/10 rounded-2xl border border-dashed border-zinc-200 dark:border-white/5">
          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground italic">"No matching invoices found"</p>
          <p className="text-xs text-muted-foreground">Try a different search term or check the bill ID.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredGroups.map((group) => {
            const totalAmount = group.items.reduce((sum, item) => sum + item.total_amount, 0)
            const itemCount = group.items.length

            return (
              <Card key={group.id} className="group hover:shadow-lg transition-all duration-500 border-zinc-200 dark:border-white/10 overflow-hidden bg-card/50 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2rem]">
                <CardContent className="p-4 md:p-6">
                  {/* Desktop Title Bar (Horizontal) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                        <Package2 className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-base tracking-tight text-foreground uppercase">
                            INV-{format(new Date(group.createdat), "ddMMyyHHmm")}
                          </p>
                          {itemCount > 1 && (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-emerald-500/20">
                              Batch
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className="h-3 w-3 text-muted-foreground/40" />
                          <p className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-widest">
                            {format(new Date(group.createdat), "dd MMM, yyyy • hh:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 flex-1 md:flex-none gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all shadow-sm"
                        onClick={() => handleDownload(group, 'THERMAL')}
                        disabled={generatingId === `${group.id}-THERMAL`}
                      >
                        {generatingId === `${group.id}-THERMAL` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                        Receipt
                      </Button>
                      <Button
                        size="sm"
                        className="h-11 flex-1 md:flex-none gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-lg"
                        onClick={() => handleDownload(group, 'A4')}
                        disabled={generatingId === `${group.id}-A4`}
                      >
                        {generatingId === `${group.id}-A4` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Full Bill
                      </Button>
                    </div>
                  </div>

                  {/* Summary & Full Item Breakdown */}
                  <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-white/10 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                      <span>Items in Order ({itemCount})</span>
                      <span className="text-foreground">₹{totalAmount.toFixed(0)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.items.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-primary/20 transition-all">
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-black tracking-tight truncate">{sale.inventory?.name || "Product"}</span>
                            <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-1">
                              {sale.quantity} × ₹{sale.sale_price.toFixed(0)}
                            </span>
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-base font-black font-mono tracking-tight">₹{sale.total_amount.toFixed(0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invoice Total Summary */}
                    <div className="p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 flex justify-between items-center mt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Invoice Total</span>
                        <span className="text-sm font-medium text-muted-foreground mt-0.5">{format(new Date(group.createdat), "dd MMM yyyy")}</span>
                      </div>
                      <span className="text-3xl font-black font-mono tracking-tighter text-primary">₹{totalAmount.toFixed(0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
