"use client"

import type { InventoryItem } from "@/lib/types"
import { Package, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import Link from "next/link"

interface InventoryListProps {
  items: InventoryItem[]
}

export function InventoryList({ items }: InventoryListProps) {
  const isOpaqueName = (value: unknown) => {
    const text = String(value || "").trim()
    if (!text) return false
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)
    const isLongToken = /^[A-Z0-9-]{24,}$/i.test(text)
    return isUuid || isLongToken
  }

  const isCodeLikeLabel = (value: unknown) => {
    const text = String(value || "").trim()
    if (!text) return false
    if (isOpaqueName(text)) return true
    const compact = text.replace(/[\s_-]+/g, "")
    if (compact.length < 6) return false
    const hasLetters = /[A-Za-z]/.test(compact)
    const hasDigits = /\d/.test(compact)
    if (!(hasLetters && hasDigits)) return false
    const vowels = compact.match(/[aeiou]/gi)?.length || 0
    return vowels <= 1
  }

  const canonical = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "")
  const deriveDisplayName = (item: InventoryItem, index: number) => {
    const raw = String(item.name || "").trim()
    if (raw && !isOpaqueName(raw)) return raw

    const sku = String(item.sku || "").trim()
    if (sku) {
      const withoutPrefix = sku.replace(/^SKU[-_]?/i, "")
      if (withoutPrefix && !isOpaqueName(withoutPrefix) && !isCodeLikeLabel(withoutPrefix)) {
        return withoutPrefix.replace(/[-_]+/g, " ").trim()
      }
      const suffix = withoutPrefix.split("-").pop() || String(index + 1)
      return `Product ${suffix}`
    }

    return `Product ${index + 1}`
  }

  const visibleItems = useMemo(() => {
    const hasLiveForKey = new Set<string>()
    for (const item of items) {
      const key = canonical(item.name || item.sku || item.id)
      if (!key) continue
      if ((item.stock || 0) > 0 && (item.buy_price || 0) > 0) {
        hasLiveForKey.add(key)
      }
    }

    return items.filter((item) => {
      const key = canonical(item.name || item.sku || item.id)
      if (!key) return true
      const looksPlaceholder = isOpaqueName(item.name) && (item.stock || 0) <= 0 && (item.buy_price || 0) <= 0
      return !(looksPlaceholder && hasLiveForKey.has(key))
    })
  }, [items])

  if (visibleItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-3xl border border-dashed border-zinc-200 animate-in fade-in duration-700">
        <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h3 className="text-lg font-bold tracking-tight text-foreground">No Assets Detected</h3>
        <p className="text-sm text-muted-foreground max-w-[280px] mt-2">
          Your inventory is currently empty. Initiate a new SKU entry to populate your archive.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleItems.map((item, idx) => {
        const isLowStock = item.stock > 0 && item.stock < 10
        const isOutOfStock = item.stock <= 0
        const displayName = deriveDisplayName(item, idx)

        return (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-emerald-500/20 transition-all group cursor-default gap-4 animate-in fade-in slide-up duration-500"
            style={{ animationDelay: `${Math.min(idx, 10) * 50}ms` }}
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                isOutOfStock ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" :
                  isLowStock ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              )}>
                <Package size={20} strokeWidth={2.5} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate group-hover:text-emerald-500 transition-colors uppercase tracking-tight">
                    {displayName}
                  </p>
                  {isOutOfStock && (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[8px] font-black uppercase tracking-widest">Out of Stock</span>
                  )}
                  {isLowStock && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest">Low Stock</span>
                  )}
                </div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
                  {item.sku || 'N/A SKU'} • {item.hsn_code ? `HSN ${item.hsn_code}` : 'NO HSN'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-10 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] leading-none mb-1">Buy Price</p>
                <div className="flex items-center justify-end gap-1">
                  <p className="text-sm font-bold tracking-tight">₹{item.buy_price.toLocaleString()}</p>
                </div>
              </div>

              <div className="text-right min-w-[100px] sm:px-6 sm:border-x border-zinc-100 dark:border-white/5">
                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] leading-none mb-1">Availability</p>
                <p className={cn(
                  "text-sm font-bold tracking-tight",
                  isOutOfStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-emerald-600"
                )}>
                  {item.stock} <span className="text-[10px] uppercase opacity-50">Units</span>
                </p>
              </div>

              <Link
                href={`/dashboard/inventory/${item.id}`}
                className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 flex items-center justify-center shadow-lg transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95 group-hover:translate-x-0"
              >
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
