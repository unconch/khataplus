
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { InventoryItem } from "@/lib/types"
import { recordBatchSales } from "@/lib/data/sales"
import { cn } from "@/lib/utils"
import { Numpad } from "@/components/pos/numpad"
import { SignatureReceipt } from "@/components/ui/signature-receipt"
import { useInventoryCache } from "@/hooks/use-inventory-cache"
import { useSync } from "@/hooks/use-sync"
import { useHaptic } from "@/hooks/use-haptic"
import { ArrowRight, Expand, FolderOpen, Minus, Moon, Plus, Save, ScanLine, Search, Shield, Sun, Trash2, Users } from "lucide-react"

type PosTerminalProps = {
  inventory: InventoryItem[]
  userId: string
  orgId: string
  org: { name: string; gstin?: string; upi_id?: string }
  gstInclusive: boolean
  gstEnabled: boolean
  showBuyPrice?: boolean
}

type PaymentMethod = "Cash" | "Card" | "UPI" | "Split"

type CartLine = {
  id: string
  item: InventoryItem
  qty: number
  price: number
  note: string
}

type HeldOrder = {
  id: string
  name: string
  createdAt: string
  cart: CartLine[]
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerGst: string
  discountPct: number
  splitCash: number
  splitCard: number
  splitUpi: number
  tendered: number
}

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "UPI", "Split"]

export function PosTerminal({ inventory, userId, orgId, org, gstEnabled, gstInclusive }: PosTerminalProps) {
  const router = useRouter()
  const { inventory: inventorySource, isOnline, applyLocalSale } = useInventoryCache(inventory, orgId)
  const { addToQueue } = useSync()
  const { trigger: haptic } = useHaptic()

  const searchRef = useRef<HTMLInputElement | null>(null)
  const barcodeBufferRef = useRef("")
  const lastBarcodeKeyTimeRef = useRef(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState("All")
  const [manualPrice, setManualPrice] = useState("")

  const [cart, setCart] = useState<CartLine[]>([])
  const [lineFlashId, setLineFlashId] = useState<string | null>(null)
  const [discountPct, setDiscountPct] = useState("0")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerGst, setCustomerGst] = useState("")

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash")
  const [splitCash, setSplitCash] = useState("")
  const [splitCard, setSplitCard] = useState("")
  const [splitUpi, setSplitUpi] = useState("")
  const [showNumpad, setShowNumpad] = useState(false)
  const [tendered, setTendered] = useState(0)

  const [holdName, setHoldName] = useState("")
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<{ amount: number; method: PaymentMethod; status: "pending" | "paid"; itemCount: number } | null>(null)
  const [posTheme, setPosTheme] = useState<"light" | "dark">("light")

  const heldKey = `khataplus_held_carts_${orgId}`
  const posThemeKey = `khataplus_pos_theme_${orgId}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(posThemeKey)
      if (saved === "light" || saved === "dark") {
        setPosTheme(saved)
        return
      }
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setPosTheme("dark")
      }
    } catch {
      setPosTheme("light")
    }
  }, [posThemeKey])

  useEffect(() => {
    try {
      localStorage.setItem(posThemeKey, posTheme)
    } catch {
      // ignore storage errors
    }
  }, [posTheme, posThemeKey])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(heldKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as HeldOrder[]
      if (Array.isArray(parsed)) setHeldOrders(parsed)
    } catch {
      setHeldOrders([])
    }
  }, [heldKey])

  const persistHeldOrders = useCallback((next: HeldOrder[]) => {
    setHeldOrders(next)
    localStorage.setItem(heldKey, JSON.stringify(next))
  }, [heldKey])

  const discountNum = useMemo(() => {
    const parsed = Number.parseFloat(discountPct)
    if (!Number.isFinite(parsed)) return 0
    return Math.max(0, Math.min(100, parsed))
  }, [discountPct])

  const discountMultiplier = 1 - discountNum / 100

  const categories = useMemo(() => {
    const set = new Set<string>()
    inventorySource.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [inventorySource])

  const categoryFiltered = useMemo(() => {
    if (activeCategory === "All") return inventorySource
    return inventorySource.filter((item) => item.category === activeCategory)
  }, [activeCategory, inventorySource])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return categoryFiltered
    return categoryFiltered.filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q))
  }, [categoryFiltered, searchQuery])

  const suggestions = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return []
    return filteredProducts.slice(0, 8)
  }, [filteredProducts, searchQuery])

  const lineTotals = useCallback((line: CartLine) => {
    const qty = Math.max(1, line.qty)
    const unitAfterDiscount = line.price * discountMultiplier
    const gstRate = Math.max(0, Number(line.item.gst_percentage || 0)) / 100

    if (!gstEnabled) {
      const subtotal = qty * unitAfterDiscount
      return { subtotal, tax: 0, total: subtotal, unitAfterDiscount }
    }

    if (gstInclusive) {
      const total = qty * unitAfterDiscount
      const subtotal = total / (1 + gstRate)
      const tax = total - subtotal
      return { subtotal, tax, total, unitAfterDiscount }
    }

    const subtotal = qty * unitAfterDiscount
    const tax = subtotal * gstRate
    const total = subtotal + tax
    return { subtotal, tax, total, unitAfterDiscount }
  }, [discountMultiplier, gstEnabled, gstInclusive])

  const totals = useMemo(() => {
    return cart.reduce((acc, line) => {
      const t = lineTotals(line)
      acc.subtotal += t.subtotal
      acc.tax += t.tax
      acc.total += t.total
      return acc
    }, { subtotal: 0, tax: 0, total: 0 })
  }, [cart, lineTotals])

  const effectiveTaxRate = totals.subtotal > 0 ? (totals.tax / totals.subtotal) * 100 : 0
  const splitCashNum = Number.parseFloat(splitCash || "0") || 0
  const splitCardNum = Number.parseFloat(splitCard || "0") || 0
  const splitUpiNum = Number.parseFloat(splitUpi || "0") || 0
  const splitPaid = splitCashNum + splitCardNum + splitUpiNum
  const splitRemaining = totals.total - splitPaid
  const change = Math.max(0, tendered - totals.total)

  const clearOrderState = () => {
    setCart([])
    setSearchQuery("")
    setManualPrice("")
    setDiscountPct("0")
    setCustomerName("")
    setCustomerPhone("")
    setCustomerGst("")
    setPaymentMethod("Cash")
    setSplitCash("")
    setSplitCard("")
    setSplitUpi("")
    setTendered(0)
    setHoldName("")
  }

  const flashLine = (id: string) => {
    setLineFlashId(id)
    window.setTimeout(() => {
      setLineFlashId((curr) => (curr === id ? null : curr))
    }, 250)
  }

  const addToCart = (item: InventoryItem, qty = 1, manualUnitPrice?: number) => {
    const unitPrice = Number.isFinite(manualUnitPrice) && (manualUnitPrice || 0) > 0
      ? Number(manualUnitPrice)
      : Number(item.sell_price || item.buy_price || 0)

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError("Invalid price for selected product.")
      return
    }

    setCart((prev) => {
      const idx = prev.findIndex((line) => line.item.id === item.id && line.price === unitPrice)
      if (idx === -1) {
        const id = `${item.id}:${unitPrice}`
        flashLine(id)
        return [...prev, { id, item, qty: Math.max(1, qty), price: unitPrice, note: "" }]
      }

      const current = prev[idx]
      const stock = Number(current.item.stock || 0)
      const nextQty = current.qty + qty
      if (current.item.id.startsWith("manual-") || nextQty <= stock) {
        const cloned = [...prev]
        cloned[idx] = { ...current, qty: nextQty }
        flashLine(current.id)
        return cloned
      }
      setError(`Only ${stock} units available for ${current.item.name}.`)
      return prev
    })

    setError(null)
    haptic("light")
  }

  const updateQty = (lineId: string, nextQty: number) => {
    setCart((prev) => {
      if (nextQty <= 0) return prev.filter((line) => line.id !== lineId)
      return prev.map((line) => {
        if (line.id !== lineId) return line
        const stock = Number(line.item.stock || 0)
        const safeQty = line.item.id.startsWith("manual-") ? nextQty : Math.min(nextQty, stock)
        return { ...line, qty: Math.max(1, safeQty) }
      })
    })
    flashLine(lineId)
  }

  const updateLineNote = (lineId: string, note: string) => {
    setCart((prev) => prev.map((line) => (line.id === lineId ? { ...line, note } : line)))
  }

  const removeLine = (lineId: string) => {
    setCart((prev) => prev.filter((line) => line.id !== lineId))
    haptic("warning")
  }

  const addManualItem = () => {
    const name = searchQuery.trim()
    const price = Number.parseFloat(manualPrice)
    if (!name) {
      setError("Enter a manual item name.")
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid manual item price.")
      return
    }

    const now = new Date().toISOString()
    const item: InventoryItem = {
      id: `manual-${Date.now()}`,
      sku: `MANUAL-${Date.now().toString().slice(-4)}`,
      name,
      buy_price: 0,
      sell_price: price,
      gst_percentage: 0,
      stock: 999999,
      category: "Custom",
      created_at: now,
      updated_at: now,
    }
    addToCart(item, 1, price)
    setSearchQuery("")
    setManualPrice("")
  }

  const tryAddFromSearch = () => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return
    const exact = inventorySource.find((item) => item.sku.toLowerCase() === q || item.name.toLowerCase() === q)
    if (exact) {
      addToCart(exact)
      setSearchQuery("")
      setActiveSuggestionIndex(0)
      return
    }
    const highlighted = suggestions[activeSuggestionIndex] || suggestions[0]
    if (highlighted) {
      addToCart(highlighted)
      setSearchQuery("")
      setActiveSuggestionIndex(0)
      return
    }
    setError("No matching product found.")
  }

  const holdOrder = () => {
    if (cart.length === 0) {
      setError("Add items before holding an order.")
      return
    }
    const held: HeldOrder = {
      id: crypto.randomUUID(),
      name: holdName.trim() || `Hold ${new Date().toLocaleTimeString()}`,
      createdAt: new Date().toISOString(),
      cart,
      paymentMethod,
      customerName,
      customerPhone,
      customerGst,
      discountPct: discountNum,
      splitCash: splitCashNum,
      splitCard: splitCardNum,
      splitUpi: splitUpiNum,
      tendered,
    }
    persistHeldOrders([held, ...heldOrders].slice(0, 30))
    clearOrderState()
    setError(null)
  }

  const resumeOrder = (id: string) => {
    const held = heldOrders.find((it) => it.id === id)
    if (!held) return
    setCart(held.cart)
    setPaymentMethod(held.paymentMethod)
    setCustomerName(held.customerName)
    setCustomerPhone(held.customerPhone)
    setCustomerGst(held.customerGst)
    setDiscountPct(String(held.discountPct || 0))
    setSplitCash(held.splitCash ? String(held.splitCash) : "")
    setSplitCard(held.splitCard ? String(held.splitCard) : "")
    setSplitUpi(held.splitUpi ? String(held.splitUpi) : "")
    setTendered(held.tendered || 0)
    persistHeldOrders(heldOrders.filter((it) => it.id !== id))
    setError(null)
  }

  const goFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      setError("Fullscreen is blocked by browser settings.")
    }
  }

  const completeSale = async () => {
    if (isSubmitting) return
    if (!userId) {
      setError("You must be logged in.")
      return
    }
    if (cart.length === 0) {
      setError("Cart is empty.")
      return
    }
    if (paymentMethod === "Split" && Math.abs(splitRemaining) > 0.01) {
      setError("Split payment must match total.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const idempotencyKey = `sale_${Date.now()}_${crypto.randomUUID()}`
      const payload = cart.map((line) => {
        const t = lineTotals(line)
        const status: "pending" | "paid" = paymentMethod === "UPI" ? "pending" : "paid"
        return {
          inventory_id: line.item.id,
          quantity: line.qty,
          sale_price: Number(t.unitAfterDiscount.toFixed(2)),
          total_amount: Number(t.total.toFixed(2)),
          gst_amount: Number(t.tax.toFixed(2)),
          profit: Number(((t.unitAfterDiscount - Number(line.item.buy_price || 0)) * line.qty).toFixed(2)),
          payment_method: paymentMethod,
          payment_status: status,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          customer_gstin: customerGst || undefined,
        }
      })

      if (!isOnline) {
        await addToQueue({
          url: "/api/sales",
          method: "POST",
          body: { sales: payload, orgId, idempotencyKey },
        })
        await applyLocalSale(payload.map((sale) => ({ inventory_id: sale.inventory_id, quantity: sale.quantity })))
      } else {
        await recordBatchSales(payload as any, orgId, idempotencyKey)
      }

      setReceipt({ amount: Number(totals.total.toFixed(2)), method: paymentMethod, status: paymentMethod === "UPI" ? "pending" : "paid", itemCount: cart.length })
      clearOrderState()
      haptic("success")
    } catch (e: any) {
      const msg = String(e?.message || "Failed to complete sale.")
      if (/insufficient stock/i.test(msg)) {
        setError("Stock changed during checkout. Recheck quantities.")
      } else {
        setError(msg.replace(/^Error:\s*/i, "").replace(/^Batch Transaction Failed:\s*/i, "").trim())
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (cart.length === 0) return
      event.preventDefault()
      event.returnValue = ""
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName || ""
      const typing = tag === "INPUT" || tag === "TEXTAREA"

      if (event.key === "F2" || (event.key === "/" && !typing)) {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
      if (event.key === "F3" && !typing) {
        event.preventDefault()
        customerNameRef.current?.focus()
        customerNameRef.current?.select()
      }
      if (event.key === "Enter" && !typing && cart.length > 0 && !showNumpad) {
        event.preventDefault()
        completeSale()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault()
        setShowNumpad(true)
      }
      if (event.key === "Escape") {
        if (showNumpad) {
          event.preventDefault()
          setShowNumpad(false)
          return
        }
        if (searchQuery) {
          event.preventDefault()
          setSearchQuery("")
          setActiveSuggestionIndex(0)
        }
      }

      const now = Date.now()
      const delta = now - lastBarcodeKeyTimeRef.current
      if (!typing && event.key.length === 1 && delta < 45) {
        barcodeBufferRef.current += event.key
        lastBarcodeKeyTimeRef.current = now
        return
      }

      if (!typing && event.key === "Enter" && barcodeBufferRef.current.length >= 3) {
        const code = barcodeBufferRef.current.toLowerCase()
        const match = inventorySource.find((item) => item.sku.toLowerCase() === code)
        if (match) {
          addToCart(match)
          barcodeBufferRef.current = ""
          lastBarcodeKeyTimeRef.current = 0
          return
        }
      }

      if (!typing && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        barcodeBufferRef.current = event.key
        lastBarcodeKeyTimeRef.current = now
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [cart.length, inventorySource, searchQuery, showNumpad])

  if (receipt) {
    return (
      <SignatureReceipt
        amount={receipt.amount}
        customerName={customerName || "Walk-in Customer"}
        customerPhone={customerPhone}
        shopName={org?.name || "My Shop"}
        upiId={org?.upi_id}
        paymentMethod={receipt.method}
        paymentStatus={receipt.status}
        itemCount={receipt.itemCount}
        onClose={() => setReceipt(null)}
        onNewSale={() => {
          setReceipt(null)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className={cn(
      "h-[100dvh] w-full flex flex-col overflow-hidden transition-colors duration-300",
      posTheme === "dark" ? "bg-zinc-950 text-zinc-100 dark" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Global Navigation Header */}
      <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
            K+
          </div>
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setActiveSuggestionIndex(0)
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  setActiveSuggestionIndex((prev) => (prev + 1) % Math.max(1, suggestions.length))
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault()
                  setActiveSuggestionIndex((prev) => (prev <= 0 ? Math.max(0, suggestions.length - 1) : prev - 1))
                }
                if (event.key === "Enter") {
                  event.preventDefault()
                  tryAddFromSearch()
                }
              }}
              placeholder="Search or scan (F2)"
              className="h-11 w-full rounded-2xl border border-zinc-200/60 bg-zinc-100/50 pl-10 pr-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:focus:bg-zinc-800 transition-all"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 animate-in fade-in slide-in-from-top-1">
                {suggestions.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { addToCart(item); setSearchQuery(""); }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors",
                      idx === activeSuggestionIndex ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{item.name}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-60 font-black">{item.sku}</span>
                    </div>
                    <span className="text-sm font-black">₹{Number(item.sell_price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <div className="hidden md:flex flex-col text-right mr-2">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Terminal</span>
            <span className="text-xs font-bold truncate max-w-[120px]">{org?.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setPosTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm"
          >
            {posTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={goFullscreen}
            className="h-10 w-10 hidden sm:flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm"
          >
            <Expand size={18} />
          </button>
          <div className="h-10 px-3 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 shadow-sm">
            <Save size={14} /> {heldOrders.length} Held
          </div>
        </div>
      </header>

      {/* Main Terminal UI */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section: Categories & Smart Grid */}
        <section className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950/50 border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Category Chips */}
          <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "h-11 min-w-max px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                  activeCategory === category
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg shadow-black/10"
                    : "bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="h-20 w-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 mb-6 border border-dashed border-zinc-300 dark:border-zinc-800">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">No products found</h3>
                <p className="mt-2 text-zinc-500 max-w-xs mx-auto">Try a different search or add a manual item for this transaction below.</p>
                <div className="mt-8 w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Manual Item Name</label>
                      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g. Carry Bag" className="h-12 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm font-bold outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Sale Price (₹)</label>
                      <input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="0.00" inputMode="decimal" className="h-12 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm font-bold outline-none focus:border-emerald-500" />
                    </div>
                    <button type="button" onClick={addManualItem} className="h-14 w-full rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition-all">Add to Cart</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((item) => {
                  const price = Number(item.sell_price || item.buy_price || 0)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="aspect-square flex flex-col items-start justify-between p-4 rounded-[2.5rem] border-2 border-zinc-200/60 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all group relative overflow-hidden"
                    >
                      <div className="w-full">
                        <h4 className="line-clamp-2 text-sm font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight mb-2 uppercase tracking-tight">{item.name}</h4>
                        <div className="flex items-center gap-1.5 opacity-40">
                          <ScanLine size={10} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{item.sku}</span>
                        </div>
                      </div>
                      <div className="w-full flex items-end justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-0.5">Price</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-white leading-none">₹{price.toFixed(0)}</span>
                        </div>
                        <div className={cn(
                          "h-8 px-2 min-w-8 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest border",
                          item.stock > (item.min_stock || 10)
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30"
                            : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30"
                        )}>
                          {item.stock}
                        </div>
                      </div>
                      {/* Decorative accent */}
                      <div className="absolute top-0 right-0 h-10 w-10 bg-emerald-500/10 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Section: Persistent Checkout Sidebar */}
        <aside className="w-96 min-w-[384px] bg-white dark:bg-zinc-900 flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10 overflow-hidden">
          {/* Customer & Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Current Order</h2>
              <button
                onClick={clearOrderState}
                className="h-8 px-3 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-colors"
                title="Clear (Esc)"
              >
                Clear
              </button>
            </div>
            <div className="space-y-3">
              <div className="relative group">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name (F3)"
                  className="h-11 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-10 pr-4 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 transition-all"
                />
              </div>
              <div className="relative group">
                <ScanLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contact number"
                  className="h-11 w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-10 pr-4 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center opacity-30 grayscale saturate-0">
                <div className="w-24 h-24 mb-6 border-4 border-dashed border-zinc-300 rounded-[2rem] flex items-center justify-center">
                  <ScanLine size={40} className="text-zinc-500" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-2">Cart is empty</p>
                <p className="text-xs font-bold text-zinc-400 max-w-[180px]">Scan a barcode or select products to begin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((line) => {
                  const t = lineTotals(line)
                  return (
                    <div
                      key={line.id}
                      className={cn(
                        "group relative rounded-[2rem] border-2 p-4 transition-all animate-in fade-in slide-in-from-right-2",
                        lineFlashId === line.id
                          ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500 shadow-lg shadow-emerald-500/10"
                          : "bg-white dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{line.item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500">₹{line.price.toFixed(2)}</span>
                            {Number(line.item.gst_percentage) > 0 && (
                              <span className="text-[9px] font-black text-zinc-400">VAT {Number(line.item.gst_percentage)}%</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="h-8 w-8 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 hover:shadow-lg hover:shadow-rose-600/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="mx-auto h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => updateQty(line.id, line.qty - 1)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 active:scale-90 transition-all shadow-sm"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            value={line.qty}
                            onChange={(e) => { const next = Number.parseInt(e.target.value || "0", 10); if (!Number.isFinite(next)) return; updateQty(line.id, next) }}
                            inputMode="numeric"
                            className="h-9 w-12 bg-transparent text-center text-sm font-black text-zinc-900 dark:text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(line.id, line.qty + 1)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 active:scale-90 transition-all shadow-sm"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-zinc-900 dark:text-white">₹{t.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom Billing Details & Pay */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 space-y-4 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] z-20">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Discount %</label>
                <input
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  inputMode="decimal"
                  className="h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-black outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">TRN / GSTIN</label>
                <input
                  value={customerGst}
                  onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                  maxLength={15}
                  className="h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-black outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-black">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">VAT/Tax ({effectiveTaxRate.toFixed(1)}%)</span>
                <span className="text-sm font-black">₹{totals.tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-700 my-2 pt-2 flex justify-between items-center px-1">
                <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Grand Total</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex p-1.5 bg-zinc-200/50 dark:bg-zinc-800/80 rounded-[1.5rem] border border-zinc-200/50 dark:border-zinc-700/50">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "flex-1 h-11 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.14em] transition-all",
                      paymentMethod === method
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg"
                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentMethod === "Split" && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-zinc-950 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
                  <input value={splitCash} onChange={(e) => setSplitCash(e.target.value)} placeholder="Cash" inputMode="decimal" className="h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 text-xs font-black outline-none focus:border-emerald-500" />
                  <input value={splitCard} onChange={(e) => setSplitCard(e.target.value)} placeholder="Card" inputMode="decimal" className="h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 text-xs font-black outline-none focus:border-emerald-500" />
                  <input value={splitUpi} onChange={(e) => setSplitUpi(e.target.value)} placeholder="UPI" inputMode="decimal" className="h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 text-xs font-black outline-none focus:border-emerald-500" />
                  <div className="h-10 flex flex-col justify-center px-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">Remaining</span>
                    <span className={cn("text-xs font-black", Math.abs(splitRemaining) < 0.01 ? "text-emerald-700" : "text-rose-600")}>₹{splitRemaining.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={completeSale}
                disabled={cart.length === 0 || isSubmitting}
                className="h-16 w-full rounded-[2rem] bg-emerald-600 dark:bg-emerald-500 text-white text-base font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale saturate-150"
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>Pay ₹{totals.total.toFixed(2)} <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Shortcut Bar */}
      <footer className="h-8 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black text-zinc-600 dark:text-zinc-400">F2</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black text-zinc-600 dark:text-zinc-400">Ctrl + P</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Numpad</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black text-zinc-600 dark:text-zinc-400">Esc</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Clear</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black text-zinc-600 dark:text-zinc-400">Enter</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pay</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full animate-pulse", isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-400")} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isOnline ? "Cloud Sync Active" : "Offline Mode"}</span>
        </div>
      </footer>

      {showNumpad && (
        <Numpad title="Amount Paid" total={totals.total} onCancel={() => setShowNumpad(false)} onConfirm={(amount) => { setTendered(amount); setShowNumpad(false) }} />
      )}

      {error && (
        <div className="fixed bottom-12 left-6 right-[400px] z-[60] bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-rose-500 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3">
            <Shield size={20} className="shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="h-8 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-black uppercase tracking-widest">Dismiss</button>
        </div>
      )}
    </div>
  )
}

