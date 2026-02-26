"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  Loader2,
  Plus,
  Tag,
  Package,
  IndianRupee,
  Percent,
  Box,
  ArrowRight,
  Search,
  Target,
  Zap
} from "lucide-react"
import { addInventoryItem } from "@/lib/data/inventory"
import { cn } from "@/lib/utils"

export function AddInventoryForm() {
  const [sku, setSku] = useState("")
  const [name, setName] = useState("")
  const [buyPrice, setBuyPrice] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [gstPercentage, setGstPercentage] = useState("18")
  const [stock, setStock] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await addInventoryItem({
        sku: sku.toUpperCase(),
        name,
        buy_price: Number.parseFloat(buyPrice),
        sell_price: sellPrice.trim() ? Number.parseFloat(sellPrice) : undefined,
        gst_percentage: Number.parseFloat(gstPercentage),
        stock: Number.parseInt(stock),
      })

      setSuccess(true)
      setSku("")
      setName("")
      setBuyPrice("")
      setSellPrice("")
      setGstPercentage("18")
      setStock("")

      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError("Unable to add item. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Design Tokens
  const sectionHeaderClasses = "flex items-center gap-2 mb-3"
  const sectionTitleClasses = "text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50"
  const inputContainerClasses = "group relative flex flex-col gap-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20"
  const labelClasses = "text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 group-focus-within:text-primary transition-colors"
  const inputClasses = "h-8 bg-transparent border-none text-sm font-bold focus:outline-none p-0 placeholder:text-zinc-200 dark:placeholder:text-white/10 font-mono tracking-tight"

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-lg font-black tracking-tight uppercase tracking-widest">Catalog Updated</h3>
        <p className="text-xs font-bold text-muted-foreground mt-1">New asset synchronization complete.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* 1. Identification */}
      <section>
        <div className={sectionHeaderClasses}>
          <Search className="h-3 w-3 text-primary/60" />
          <h3 className={sectionTitleClasses}>Product Identification</h3>
        </div>
        <div className="space-y-4">
          <div className={inputContainerClasses}>
            <Label htmlFor="name" className={labelClasses}>Descriptive Name</Label>
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-primary/30" />
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Silk Scarf"
                required
                className={cn(inputClasses, "w-full")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={inputContainerClasses}>
              <Label htmlFor="sku" className={labelClasses}>Unique SKU Code</Label>
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-primary/30" />
                <input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-XXXX"
                  required
                  className={cn(inputClasses, "w-full uppercase")}
                />
              </div>
            </div>
            <div className={inputContainerClasses}>
              <Label htmlFor="stock" className={labelClasses}>Opening Stock</Label>
              <div className="flex items-center gap-3">
                <Box className="h-4 w-4 text-primary/30" />
                <input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  required
                  className={cn(inputClasses, "w-full")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Commercial Values */}
      <section>
        <div className={sectionHeaderClasses}>
          <Target className="h-3 w-3 text-primary/60" />
          <h3 className={sectionTitleClasses}>Commercial Valuations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={inputContainerClasses}>
            <Label htmlFor="buyPrice" className={labelClasses}>Inventory Cost (Per Unit)</Label>
            <div className="flex items-center gap-3">
              <IndianRupee className="h-4 w-4 text-emerald-500/30" />
              <input
                id="buyPrice"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                required
                className={cn(inputClasses, "w-full")}
              />
            </div>
          </div>
          <div className={inputContainerClasses}>
            <Label htmlFor="sellPrice" className={labelClasses}>Selling Price (Per Unit)</Label>
            <div className="flex items-center gap-3">
              <IndianRupee className="h-4 w-4 text-blue-500/40" />
              <input
                id="sellPrice"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Optional"
                className={cn(inputClasses, "w-full")}
              />
            </div>
          </div>
          <div className={inputContainerClasses}>
            <Label htmlFor="gst" className={labelClasses}>Standard GST Rate (%)</Label>
            <div className="flex items-center gap-3">
              <Percent className="h-4 w-4 text-primary/30" />
              <input
                id="gst"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max="100"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                placeholder="18"
                required
                className={cn(inputClasses, "w-full")}
              />
            </div>
          </div>
        </div>
      </section>

      {error && <p className="text-xs font-black text-rose-500 bg-rose-500/10 p-4 rounded-2xl text-center uppercase tracking-tight">{error}</p>}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-xl group"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Asset
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </span>
          )}
        </Button>
      </div>


      <div className="flex items-center justify-center gap-2 text-muted-foreground/30 py-4">
        <Zap className="h-3 w-3" />
        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Institutional Grade Inventory Control</span>
      </div>
    </form>
  )
}
