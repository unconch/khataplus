"use client"

import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import type { InventoryItem } from "@/lib/types"
import { InventoryList } from "@/components/inventory-list"
import { useMotion } from "@/components/motion-provider"
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
  const { enableMotion } = useMotion()
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
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
    setIsLoadingMore(false)
  }, [query, items.length])

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current || isLoadingMore) return

    const node = loadMoreRef.current
    let frameId: number | null = null
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting || isLoadingMore) return

        setIsLoadingMore(true)
        frameId = window.requestAnimationFrame(() => {
          startTransition(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length))
          })
          setIsLoadingMore(false)
        })
      },
      { root: null, rootMargin: "240px 0px 240px 0px", threshold: 0.01 }
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [hasMore, isLoadingMore, filteredItems.length])

  return (
    <div className="space-y-5 md:space-y-8">
      <div className={`flex flex-col justify-between gap-4 border-b border-zinc-100 pb-4 md:gap-6 md:pb-6 dark:border-white/8 lg:flex-row lg:items-center ${enableMotion ? "page-enter" : ""}`}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-white/8 dark:bg-[rgba(30,41,59,0.72)] dark:text-zinc-100 md:h-12 md:w-12">
            <ListIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Operational Stock</h3>
            <p className="text-xs text-muted-foreground">Manage and track your entire inventory</p>
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-2 md:gap-4 w-full lg:w-auto ${enableMotion ? "page-enter" : ""}`}>
          <div className="relative group flex-1 min-w-0 md:min-w-[300px]">
            <SearchIcon className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Search inventory SKU or name..."
              className="h-10 rounded-xl border-zinc-200 bg-zinc-50 pl-10 focus-visible:ring-1 focus-visible:ring-emerald-500/50 dark:border-white/8 dark:bg-[rgba(15,23,42,0.82)] md:h-11 md:pl-11"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ImportDialog
              type="inventory"
              orgId={orgId}
              trigger={
                <Button variant="outline" size="sm" className="h-10 rounded-xl border-zinc-200 px-3 text-[10px] font-bold uppercase tracking-wider transition-all hover-scale hover:bg-zinc-50 dark:border-white/8 dark:bg-[rgba(30,41,59,0.66)] dark:hover:bg-[rgba(51,65,85,0.86)] md:h-11 md:px-4 md:text-[11px]">
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
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-zinc-200 px-3 text-[10px] font-bold uppercase tracking-wider transition-all hover-scale hover:bg-zinc-50 dark:border-white/8 dark:bg-[rgba(30,41,59,0.66)] dark:hover:bg-[rgba(51,65,85,0.86)] md:h-11 md:px-4 md:text-[11px]">
                      Adjust
                    </Button>
                  }
                />
                <AddInventoryDialog
                  orgId={orgId}
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

      <InventoryList items={visibleItems} orgId={orgId} />

      {(hasMore || isLoadingMore) && (
        <div ref={loadMoreRef} className="mx-auto w-full max-w-[980px] flex flex-col items-center gap-3 py-2">
          {isLoadingMore && (
            <div className="w-full space-y-3">
              <div className="h-20 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-50 dark:border-white/8 dark:bg-[rgba(30,41,59,0.5)]" />
              <div className="h-20 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-50 dark:border-white/8 dark:bg-[rgba(30,41,59,0.5)]" style={{ animationDelay: "120ms" }} />
            </div>
          )}
          {hasMore && (
            <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">
              {isLoadingMore ? "Loading more items..." : "Scroll to load more assets"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
