"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Loader2 } from "lucide-react"
import type { InventoryItem } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EditStockDialogProps {
  items: InventoryItem[]
  orgId: string
  trigger?: React.ReactNode
}

export function EditStockDialog({ items, orgId, trigger }: EditStockDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [search, setSearch] = useState("")
  const [stock, setStock] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  const selectedItem = sortedItems.find((i) => i.id === selectedId) || null
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedItems.slice(0, 8)
    return sortedItems
      .filter((item) =>
        item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
      )
      .slice(0, 20)
  }, [sortedItems, search])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const item = sortedItems.find((i) => i.id === id)
    if (item) {
      setStock(String(item.stock))
      setSearch(item.name)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearch("")
      setSelectedId("")
      setStock("")
    }
  }

  const handleSave = async () => {
    if (!selectedId) {
      toast.error("Select an item first")
      return
    }
    const nextStock = Number.parseInt(stock, 10)
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      toast.error("Stock must be a non-negative number")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          newStock: nextStock,
          orgId,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to update stock")
      }

      toast.success("Stock updated")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update stock")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="h-9 gap-2 shadow-sm transition-all active:scale-95 hover:bg-zinc-50 dark:border-white/10 dark:bg-[rgba(15,23,42,0.78)] dark:hover:bg-[rgba(30,41,59,0.9)]">
            <Pencil className="h-3.5 w-3.5" />
            <span className="text-[11px] font-black uppercase tracking-widest">Edit Stock</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-none bg-transparent p-0 shadow-2xl sm:max-w-[600px]">
        <div className="relative space-y-6 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-6 dark:border-white/10 dark:bg-[rgba(15,23,42,0.95)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-30" />

          <DialogHeader className="space-y-1 relative z-10">
            <DialogTitle className="text-xl font-black italic tracking-tighter text-zinc-950 dark:text-zinc-50 leading-none">
              Adjust <span className="text-amber-600">Inventory.</span>
            </DialogTitle>
            <DialogDescription className="text-[11px] font-bold text-zinc-400 leading-tight uppercase tracking-tight">
              Select a product to synchronize physical stock values.
            </DialogDescription>
          </DialogHeader>


          <div className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Product Discovery</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                className="h-9 rounded-xl border-zinc-100 bg-zinc-50/90 font-bold text-xs dark:border-white/10 dark:bg-[rgba(30,41,59,0.72)] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredItems.length > 0) {
                    e.preventDefault()
                    handleSelect(filteredItems[0].id)
                  }
                }}
              />
              <div className="max-h-40 overflow-y-auto rounded-xl border border-dashed border-zinc-100 bg-zinc-50/40 dark:border-white/10 dark:bg-[rgba(15,23,42,0.56)]">
                {filteredItems.length === 0 ? (
                  <p className="px-3 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-500">No matching assets</p>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`group w-full border-b border-zinc-100 px-3 py-2 text-left transition-all last:border-b-0 hover:bg-white dark:border-white/6 dark:hover:bg-[rgba(30,41,59,0.82)] ${selectedId === item.id ? "bg-white ring-1 ring-inset ring-amber-500/20 dark:bg-[rgba(30,41,59,0.88)]" : ""
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-tight text-zinc-950 dark:text-zinc-50">{item.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{item.sku}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-500">{item.stock}</span>
                          <p className="text-[7px] font-black uppercase text-zinc-300 dark:text-zinc-500">Current</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Target Quantity</label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                className="h-11 rounded-xl border-zinc-100 bg-zinc-50/90 pl-4 text-xl font-black text-amber-600 dark:border-white/10 dark:bg-[rgba(30,41,59,0.72)] dark:text-amber-400"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase tracking-widest pointer-events-none">Units</div>
              </div>
              {selectedItem && (
                <div className="flex items-center gap-2 px-1">
                  <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-300">
                    Modifying <span className="text-zinc-900 dark:text-zinc-100">{selectedItem.name}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 relative z-10">
              <Button
                onClick={handleSave}
                disabled={saving || !selectedId}
                className="h-11 rounded-xl bg-zinc-950 text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all hover:opacity-90 active:scale-95 dark:bg-emerald-400 dark:text-slate-950 dark:shadow-[0_14px_30px_rgba(16,185,129,0.18)]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving} className="h-9 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-200">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
