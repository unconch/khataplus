"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Sale } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileTextIcon, Printer, Download, Loader2, Search, MessageCircle, User, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { generateInvoice, type GroupedSale } from "@/lib/invoice-utils"
import { getWhatsAppUrl, WhatsAppMessages } from "@/lib/whatsapp"
import { toast } from "sonner"

interface GstBillsProps {
  sales: Sale[]
  org?: { name: string; gstin?: string; upi_id?: string }
}

export function GstBills({ sales, org }: GstBillsProps) {
  const PAGE_SIZE = 12
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isArchiveLoading, setIsArchiveLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsArchiveLoading(true)
    const id = window.setTimeout(() => setIsArchiveLoading(false), 350)
    return () => window.clearTimeout(id)
  }, [sales.length])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchQuery, sales.length])

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
          customerName: sale.customer_name,
          customerPhone: sale.customer_phone,
          items: [],
        }
      }
      acc[key].items.push(sale)
      return acc
    }, {} as Record<string, GroupedSale>)
  }, [sales])

  const getInvoiceId = (group: GroupedSale) => {
    const datePart = format(new Date(group.saledate), "ddMMyy")
    const idPart = String(group.id || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-6)
      .toUpperCase()
      .padStart(6, "0")
    return `INV-${datePart}-${idPart}`
  }

  const filteredGroups = useMemo(() => {
    const sorted = Object.values(groupedSales).sort(
      (a, b) => new Date(b.saledate).getTime() - new Date(a.saledate).getTime()
    )
    if (!searchQuery) return sorted

    const query = searchQuery.toLowerCase()
    return sorted.filter((group) => {
      const billId = getInvoiceId(group)
      const matchesId = billId.toLowerCase().includes(query)
      const matchesItem = group.items.some((item) => (item.inventory?.name || "").toLowerCase().includes(query))
      const totalAmount = group.items.reduce((sum, item) => sum + item.total_amount, 0)
      const matchesAmount = totalAmount.toString().includes(query)
      const matchesCustomer = (group.customerName || "").toLowerCase().includes(query)
      return matchesId || matchesItem || matchesAmount || matchesCustomer
    })
  }, [groupedSales, searchQuery])

  const handleDownload = async (group: GroupedSale, type: "A4" | "THERMAL") => {
    setGeneratingId(`${group.id}-${type}`)
    try {
      await generateInvoice(group, type, org)
    } catch {
      toast.error("Failed to generate invoice")
    } finally {
      setGeneratingId(null)
    }
  }

  const visibleGroups = useMemo(() => filteredGroups.slice(0, visibleCount), [filteredGroups, visibleCount])
  const hasMore = visibleCount < filteredGroups.length

  useEffect(() => {
    if (isArchiveLoading || !hasMore || !loadMoreRef.current) return

    const node = loadMoreRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting || isLoadingMore) return

        setIsLoadingMore(true)
        window.setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredGroups.length))
          setIsLoadingMore(false)
        }, 650)
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isArchiveLoading, hasMore, isLoadingMore, filteredGroups.length])

  if (isArchiveLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm top-0 z-20 sticky">
          <div className="h-11 w-full rounded-xl bg-zinc-100 animate-pulse" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="mx-auto w-full max-w-[1040px] bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm animate-pulse"
              style={{ animationDelay: `${idx * 140}ms` }}
            >
              <div className="h-24 w-full rounded bg-zinc-50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (Object.keys(groupedSales).length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-200 text-center flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
          <FileTextIcon className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-950">No Invoices Issued</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Invoice records will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm top-0 z-20 sticky mb-6 group/search">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex items-center flex-1">
            <Search className="absolute left-4 h-3.5 w-3.5 text-zinc-400 group-focus-within/search:text-emerald-500 transition-colors" />
            <Input
              placeholder="FILTER TRANSACTION ARCHIVES..."
              className="pl-10 h-9 bg-zinc-50 dark:bg-zinc-900 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-emerald-500/30 transition-all font-black text-[10px] uppercase tracking-widest placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 hidden sm:flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
              <kbd className="h-6 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-[9px] font-black text-zinc-400 flex items-center tracking-tighter shadow-sm">SEARCH_FS</kbd>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        {visibleGroups.map((group, idx) => {
          const totalAmount = group.items.reduce((sum, item) => sum + item.total_amount, 0)
          const itemCount = group.items.length
          const invoiceId = getInvoiceId(group)

          return (
            <div
              key={group.id}
              className="mx-auto w-full max-w-[1040px] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-white/5 p-4 md:p-5 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all duration-500 group/bill animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden"
              style={{ animationDelay: `${Math.min(idx, 10) * 55}ms` }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 via-blue-500 to-emerald-500 opacity-0 group-hover/bill:opacity-100 transition-opacity duration-500" />

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4 border-b border-zinc-50 dark:border-white/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[12px] font-black text-zinc-950 dark:text-zinc-50 tracking-tighter uppercase">{invoiceId}</h3>
                    <div className="h-5 px-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      Verified
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="h-px w-2 bg-zinc-200 dark:bg-zinc-800" />
                    {format(new Date(group.saledate), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {group.customerPhone && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-100 transition-all shadow-sm"
                      onClick={() => {
                        const msg = WhatsAppMessages.invoiceShare(group.customerName, "Business", totalAmount, group.id)
                        window.open(getWhatsAppUrl(group.customerPhone!, msg), "_blank")
                      }}
                    >
                      <MessageCircle size={15} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="py-4">
                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                  <div className="h-px w-6 bg-zinc-100 dark:bg-zinc-800" />
                  Line Items ({itemCount})
                </div>
                <div className="rounded-xl border border-zinc-50 dark:border-white/5 overflow-hidden">
                  <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/5 bg-white dark:bg-zinc-950">
                    {group.items.map((sale) => (
                      <div key={sale.id} className="p-3">
                        <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-tight mb-2">
                          {sale.inventory?.name || "Item"}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Qty</p>
                            <p className="text-[12px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums">{sale.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Price</p>
                            <p className="text-[12px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums whitespace-nowrap">Rs {Number(sale.sale_price).toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Sum</p>
                            <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 tabular-nums whitespace-nowrap">Rs {Number(sale.total_amount).toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] text-zinc-400 dark:text-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/50">
                          <th className="py-2 px-4 font-black uppercase tracking-widest">Description</th>
                          <th className="w-20 py-2 px-4 font-black uppercase tracking-widest text-center tabular-nums">Qty</th>
                          <th className="w-28 py-2 px-4 font-black uppercase tracking-widest text-center tabular-nums">Price</th>
                          <th className="w-32 py-2 px-4 font-black uppercase tracking-widest text-center tabular-nums text-emerald-600">Sum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
                        {group.items.map((sale) => (
                          <tr key={sale.id} className="group/row hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-[12px] font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-tight">{sale.inventory?.name || "Item"}</td>
                            <td className="w-20 py-3 px-4 text-[12px] text-center font-bold text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">{sale.quantity}</td>
                            <td className="w-28 py-3 px-4 text-[12px] text-center font-bold text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">Rs {Number(sale.sale_price).toFixed(0)}</td>
                            <td className="w-32 py-3 px-4 text-[12px] text-center font-black text-zinc-950 dark:text-zinc-100 tabular-nums whitespace-nowrap">Rs {Number(sale.total_amount).toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-50 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <div className="inline-flex max-w-full items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-white/5 shadow-sm">
                    <User size={12} className="text-blue-500" />
                    <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap truncate">
                      {group.customerName || "Walk-in Guest"}
                    </span>
                  </div>
                  <div className="inline-flex max-w-full items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-white/5 shadow-sm">
                    <CreditCard size={12} className="text-emerald-500" />
                    <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap truncate">
                      {group.paymentMethod || "CASH_SETTLEMENT"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-2.5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 leading-none">
                      Settlement
                    </span>
                    <span className="h-4 w-px bg-zinc-200 dark:bg-white/10" />
                    <span className="text-xl font-black italic tracking-tighter leading-none tabular-nums text-zinc-950 dark:text-zinc-100">
                      <span className="text-emerald-600 mr-1">Rs</span>
                      {totalAmount.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-4 rounded-xl text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-100 dark:hover:border-white/5"
                      onClick={() => handleDownload(group, "THERMAL")}
                      disabled={generatingId?.startsWith(group.id)}
                    >
                      {generatingId === `${group.id}-THERMAL` ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <Printer className="h-3 w-3 mr-2 text-blue-500" />
                      )}
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-2 rounded-lg text-zinc-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:bg-transparent hover:text-zinc-950 dark:hover:text-zinc-100 shadow-none border-0"
                      onClick={() => handleDownload(group, "A4")}
                      disabled={generatingId?.startsWith(group.id)}
                    >
                      {generatingId === `${group.id}-A4` ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <Download className="h-3.5 w-3.5 mr-2 text-zinc-700 dark:text-zinc-300" />
                      )}
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {(hasMore || isLoadingMore) && (
          <div ref={loadMoreRef} className="mx-auto w-full max-w-[1040px] flex flex-col items-center gap-3 py-2">
            {isLoadingMore && (
              <div className="w-full space-y-2">
                <div className="h-20 rounded-2xl border border-zinc-100 bg-zinc-50 animate-pulse" />
                <div className="h-20 rounded-2xl border border-zinc-100 bg-zinc-50 animate-pulse" style={{ animationDelay: "120ms" }} />
                <div className="h-20 rounded-2xl border border-zinc-100 bg-zinc-50 animate-pulse" style={{ animationDelay: "240ms" }} />
              </div>
            )}
            {hasMore && (
              <span className="text-[11px] text-zinc-400">
                Loading more bills...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
