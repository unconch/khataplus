"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { InventoryItem } from "@/lib/types"
import { InventoryList } from "@/components/inventory-list"
import { ListIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AddInventoryDialog } from "@/components/add-inventory-dialog"
import { EditStockDialog } from "@/components/edit-stock-dialog"
import { ImportDialog } from "@/components/import-dialog"
import { Button } from "@/components/ui/button"

interface InventoryBrowserProps {
  items: InventoryItem[]
  orgId: string
  canAdd: boolean
}

export function InventoryBrowser({ items, orgId, canAdd }: InventoryBrowserProps) {
  const PAGE_SIZE = 20
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items

    return items.filter((item) => {
      const name = String(item.name || "").toLowerCase()
      const sku = String(item.sku || "").toLowerCase()
      const hsn = String(item.hsn_code || "").toLowerCase()
      return name.includes(q) || sku.includes(q) || hsn.includes(q)
    })
  }, [items, query])

  const isSearching = query.trim().length > 0
  const visibleItems = useMemo(() => {
    if (isSearching) return filteredItems
    return filteredItems.slice(0, visibleCount)
  }, [filteredItems, visibleCount, isSearching])

  const hasMore = !isSearching && visibleCount < filteredItems.length

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
    setHasUserInteracted(false)
    setIsLoadingMore(false)
  }, [query, items.length])

  useEffect(() => {
    const markInteracted = () => {
      setHasUserInteracted(true)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PageDown" || e.key === "ArrowDown" || e.key === " ") {
        markInteracted()
      }
    }

    window.addEventListener("scroll", markInteracted, { passive: true })
    window.addEventListener("wheel", markInteracted, { passive: true })
    window.addEventListener("touchmove", markInteracted, { passive: true })
    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("scroll", markInteracted)
      window.removeEventListener("wheel", markInteracted)
      window.removeEventListener("touchmove", markInteracted)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!hasMore || !hasUserInteracted || !loadMoreRef.current || isLoadingMore) return

    const node = loadMoreRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting || isLoadingMore) return

        setIsLoadingMore(true)
        window.setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length))
          setIsLoadingMore(false)
        }, 550)
      },
      { root: null, rootMargin: "240px 0px 240px 0px", threshold: 0.01 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, hasUserInteracted, isLoadingMore, filteredItems.length])

  return (
    <div className="space-y-5 md:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 pb-4 md:pb-6 border-b border-zinc-100 dark:border-white/5 animate-in fade-in slide-up duration-500">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/5">
            <ListIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Operational Stock</h3>
            <p className="text-xs text-muted-foreground">Manage and track your entire inventory</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 animate-in fade-in slide-up duration-700 stagger-1 w-full lg:w-auto">
          <div className="relative group flex-1 min-w-0 md:min-w-[300px]">
            <SearchIcon className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Search inventory SKU or name..."
              className="pl-10 md:pl-11 h-10 md:h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-white/5 rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ImportDialog
              type="inventory"
              orgId={orgId}
              trigger={
                <Button variant="outline" size="sm" className="h-10 md:h-11 px-3 md:px-4 rounded-xl border-zinc-200 dark:border-white/5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all hover-scale">
                  Import
                </Button>
              }
            />
            {canAdd && (
              <>
                <EditStockDialog
                  items={items}
                  orgId={orgId}
                  trigger={
                    <Button variant="outline" size="sm" className="h-10 md:h-11 px-3 md:px-4 rounded-xl border-zinc-200 dark:border-white/5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all hover-scale">
                      Adjust
                    </Button>
                  }
                />
                <AddInventoryDialog
                  trigger={
                    <Button size="sm" className="h-10 md:h-11 px-4 md:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 text-[10px] md:text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-all active:scale-95">
                      New SKU
                    </Button>
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>

      <InventoryList items={visibleItems} />

      {(hasMore || isLoadingMore) && (
        <div ref={loadMoreRef} className="mx-auto w-full max-w-[980px] flex flex-col items-center gap-3 py-2">
          {isLoadingMore && (
            <div className="w-full space-y-3">
              <div className="h-20 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 animate-pulse" />
              <div className="h-20 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 animate-pulse" style={{ animationDelay: "120ms" }} />
            </div>
          )}
          {hasMore && (
            <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">
              {hasUserInteracted ? "Hydrating further records..." : "Scroll to load more assets"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
