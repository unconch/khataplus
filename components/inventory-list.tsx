"use client"

import type { InventoryItem } from "@/lib/types"
import { Package, ArrowRight, Archive } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMotion } from "@/components/motion-provider"

interface InventoryListProps {
  items: InventoryItem[]
  orgId: string
}

export function InventoryList({ items, orgId }: InventoryListProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { enableMotion } = useMotion()
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const inventoryDetailBasePath = pathname?.replace(/\/+$/, "") || "/dashboard/inventory"

  const archiveItem = async (id: string, name: string) => {
    const confirmed = window.confirm(`Archive "${name}"? It will be hidden from inventory list.`)
    if (!confirmed) return

    try {
      setArchivingId(id)
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, orgId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to archive item")
      router.refresh()
    } catch (e: any) {
      window.alert(e?.message || "Could not archive item")
    } finally {
      setArchivingId(null)
    }
  }
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
  const shouldAnimateRows = enableMotion && visibleItems.length <= 24

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
            className={cn(
              "group flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition-all duration-300 hover:bg-white hover:border-zinc-200 dark:border-white/8 dark:bg-[rgba(15,23,42,0.66)] dark:hover:border-white/12 dark:hover:bg-[rgba(30,41,59,0.78)] sm:flex-row",
              shouldAnimateRows && "animate-in fade-in slide-up"
            )}
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "96px",
              ...(shouldAnimateRows ? { animationDelay: `${Math.min(idx, 8) * 35}ms` } : {}),
            }}
          >
              <div className="flex w-full items-center gap-4 sm:w-auto">
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
                <p className="text-[10px] font-medium uppercase tracking-widest leading-none text-muted-foreground dark:text-zinc-400">
                  {item.sku || 'N/A SKU'} • {item.hsn_code ? `HSN ${item.hsn_code}` : 'NO HSN'}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-6 sm:w-auto sm:justify-end sm:gap-10">
              <div className="text-right">
                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] leading-none text-muted-foreground/60 dark:text-zinc-500">Buy Price</p>
                <div className="flex items-center justify-end gap-1">
                  <p className="text-sm font-bold tracking-tight">₹{item.buy_price.toLocaleString()}</p>
                </div>
              </div>

              <div className="min-w-[100px] border-zinc-100 text-right dark:border-white/8 sm:border-x sm:px-6">
                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] leading-none text-muted-foreground/60 dark:text-zinc-500">Availability</p>
                <p className={cn(
                  "text-sm font-bold tracking-tight",
                  isOutOfStock ? "text-rose-600 dark:text-rose-400" : isLowStock ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {item.stock} <span className="text-[10px] uppercase opacity-50 dark:opacity-70">Units</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => archiveItem(item.id, displayName)}
                  disabled={archivingId === item.id}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-wider text-zinc-700 disabled:opacity-50 dark:border-white/10 dark:bg-[rgba(30,41,59,0.7)] dark:text-zinc-100 dark:hover:border-white/20"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Archive size={14} />
                    {archivingId === item.id ? "..." : "Archive"}
                  </span>
                </button>
                <Link
                  href={`${inventoryDetailBasePath}/${item.id}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-lg transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95 group-hover:translate-x-0 dark:bg-[rgba(30,41,59,0.92)] dark:text-zinc-100 dark:shadow-[0_10px_24px_rgba(0,0,0,0.26)] dark:hover:bg-emerald-500 dark:hover:text-slate-950"
                >
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
