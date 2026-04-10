"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Sale } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChevronDown,
  Download,
  FileTextIcon,
  Loader2,
  MessageCircle,
  Printer,
  Search,
} from "lucide-react"
import { format } from "date-fns"
import { generateInvoice, type GroupedSale } from "@/lib/invoice-utils"
import { getWhatsAppUrl, WhatsAppMessages } from "@/lib/whatsapp"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface GstBillsProps {
  sales: Sale[]
  org?: { name: string; gstin?: string; upi_id?: string }
}

const PAGE_SIZE = 12

export function GstBills({ sales, org }: GstBillsProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isArchiveLoading, setIsArchiveLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Record<string, boolean>>({})
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsArchiveLoading(true)
    const id = window.setTimeout(() => setIsArchiveLoading(false), 250)
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

    if (!searchQuery.trim()) return sorted

    const query = searchQuery.trim().toLowerCase()
    return sorted.filter((group) => {
      const invoiceId = getInvoiceId(group).toLowerCase()
      const itemNames = group.items.map((item) => item.inventory?.name || "").join(" ").toLowerCase()
      const customerName = String(group.customerName || "").toLowerCase()
      const paymentMethod = String(group.paymentMethod || "").toLowerCase()
      const totalAmount = group.items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
      const dateLabel = format(new Date(group.saledate), "dd/MM/yyyy HH:mm").toLowerCase()

      return [invoiceId, itemNames, customerName, paymentMethod, String(totalAmount), dateLabel].some((value) =>
        value.includes(query)
      )
    })
  }, [groupedSales, searchQuery])

  const visibleGroups = useMemo(() => filteredGroups.slice(0, visibleCount), [filteredGroups, visibleCount])
  const hasMore = visibleCount < filteredGroups.length
  const historyTotal = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.items.reduce((inner, item) => inner + Number(item.total_amount || 0), 0), 0),
    [filteredGroups]
  )

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
        }, 500)
      },
      { root: null, rootMargin: "280px 0px", threshold: 0.01 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [filteredGroups.length, hasMore, isArchiveLoading, isLoadingMore])

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

  const toggleExpanded = (invoiceId: string) => {
    setExpandedInvoiceIds((current) => ({
      ...current,
      [invoiceId]: !current[invoiceId],
    }))
  }

  if (isArchiveLoading) {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-20 rounded-[1.25rem] border border-zinc-100 bg-white/95 p-4 shadow-sm dark:border-white/8 dark:bg-[rgba(15,23,42,0.9)]">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="h-10 rounded-xl bg-zinc-100 dark:bg-white/5 animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-zinc-100 dark:bg-white/5 animate-pulse" />
            <div className="h-10 w-32 rounded-xl bg-zinc-100 dark:bg-white/5 animate-pulse" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[rgba(15,23,42,0.78)]"
          >
            <div className="space-y-3 animate-pulse">
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-40 rounded bg-zinc-100 dark:bg-white/5" />
                <div className="h-5 w-24 rounded bg-zinc-100 dark:bg-white/5" />
              </div>
              <div className="h-3 w-56 rounded bg-zinc-100 dark:bg-white/5" />
              <div className="grid gap-2 md:grid-cols-4">
                <div className="h-12 rounded-xl bg-zinc-50 dark:bg-white/5" />
                <div className="h-12 rounded-xl bg-zinc-50 dark:bg-white/5" />
                <div className="h-12 rounded-xl bg-zinc-50 dark:bg-white/5" />
                <div className="h-12 rounded-xl bg-zinc-50 dark:bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-zinc-200 bg-white p-10 text-center dark:border-white/10 dark:bg-[rgba(15,23,42,0.72)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 dark:bg-white/5 dark:text-zinc-500">
          <FileTextIcon className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-100">
            No matching invoices
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Try a different search term or create a new sale to populate history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 rounded-[1.25rem] border border-zinc-100 bg-white/95 p-4 shadow-sm backdrop-blur-md dark:border-white/8 dark:bg-[rgba(15,23,42,0.9)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sales History</p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-100">
              Invoice Archive
            </h3>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_auto] lg:items-center">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search invoice, customer, item, amount, or date"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 rounded-xl border-zinc-200 bg-zinc-50 pl-10 dark:border-white/8 dark:bg-[rgba(30,41,59,0.65)]"
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/8 dark:bg-[rgba(30,41,59,0.65)]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Invoices</p>
              <p className="mt-1 text-sm font-black text-zinc-950 dark:text-zinc-100">{filteredGroups.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/8 dark:bg-[rgba(30,41,59,0.65)]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Value</p>
              <p className="mt-1 text-sm font-black text-zinc-950 dark:text-zinc-100">
                Rs {Math.round(historyTotal).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visibleGroups.map((group) => {
          const totalAmount = group.items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
          const itemCount = group.items.length
          const invoiceId = getInvoiceId(group)
          const isExpanded = Boolean(expandedInvoiceIds[group.id])

          return (
            <article
              key={group.id}
              className="overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm dark:border-white/8 dark:bg-[rgba(15,23,42,0.72)]"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black tracking-tight text-zinc-950 dark:text-zinc-100">
                        {invoiceId}
                      </h4>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Verified
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:border-white/8 dark:bg-white/5 dark:text-zinc-300">
                        {group.paymentMethod || "Cash"}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Customer</p>
                        <p className="mt-1 truncate font-semibold">{group.customerName || "Walk-in customer"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Date</p>
                        <p className="mt-1 font-semibold">{format(new Date(group.saledate), "dd MMM yyyy, hh:mm a")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Summary</p>
                        <p className="mt-1 font-semibold">{itemCount} items in this invoice</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 xl:items-end">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left dark:border-white/8 dark:bg-white/5 xl:text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Invoice Total</p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
                        Rs {Math.round(totalAmount).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(group.id)}
                        className="rounded-xl"
                      >
                        <ChevronDown className={cn("mr-2 h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                        {isExpanded ? "Hide Items" : "View Items"}
                      </Button>

                      {group.customerPhone ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          onClick={() => {
                            const msg = WhatsAppMessages.invoiceShare(group.customerName, "Business", totalAmount, group.id)
                            window.open(getWhatsAppUrl(group.customerPhone!, msg), "_blank")
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleDownload(group, "THERMAL")}
                        disabled={generatingId?.startsWith(group.id)}
                      >
                        {generatingId === `${group.id}-THERMAL` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Printer className="mr-2 h-4 w-4" />
                        )}
                        Print
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleDownload(group, "A4")}
                        disabled={generatingId?.startsWith(group.id)}
                      >
                        {generatingId === `${group.id}-A4` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-4 dark:border-white/8 dark:bg-[rgba(30,41,59,0.4)] sm:px-5">
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/8 dark:bg-[rgba(15,23,42,0.72)]">
                    <div className="hidden grid-cols-[minmax(0,1fr)_90px_120px_140px] border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 dark:border-white/8 dark:bg-white/5 dark:text-zinc-500 md:grid">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-center">Price</span>
                      <span className="text-right">Amount</span>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-white/8">
                      {group.items.map((sale) => (
                        <div key={sale.id} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_90px_120px_140px] md:items-center">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                              {sale.inventory?.name || "Item"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-sm md:block md:text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 md:hidden">Qty</span>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sale.quantity}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm md:block md:text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 md:hidden">Price</span>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              Rs {Number(sale.sale_price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm md:block md:text-right">
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 md:hidden">Amount</span>
                            <span className="font-black text-zinc-950 dark:text-zinc-100">
                              Rs {Number(sale.total_amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}

        {hasMore || isLoadingMore ? (
          <div ref={loadMoreRef} className="flex flex-col items-center gap-3 py-3">
            {isLoadingMore ? (
              <div className="w-full space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 rounded-[1.5rem] border border-zinc-100 bg-zinc-50 animate-pulse dark:border-white/8 dark:bg-white/5"
                  />
                ))}
              </div>
            ) : null}
            {hasMore ? <span className="text-[11px] text-zinc-400">Loading more invoices...</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
