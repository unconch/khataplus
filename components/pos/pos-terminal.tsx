
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
import { Expand, FolderOpen, Minus, Moon, Plus, Save, ScanLine, Search, Sun, Trash2 } from "lucide-react"

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
    <div className={cn("h-[100dvh] w-full text-zinc-950", posTheme === "dark" ? "dark bg-zinc-950 text-zinc-100" : "bg-zinc-100")}>
      <div className="grid h-full grid-rows-[auto_1fr_auto]">
        <header className="border-b border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
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
                placeholder="Search products or scan barcode..."
                className="h-14 w-full rounded-xl border border-zinc-300 bg-zinc-50 pl-12 pr-4 text-base font-semibold outline-none focus:border-emerald-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                <ScanLine className="h-3.5 w-3.5" />
                Scan
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setPosTheme((t) => (t === "dark" ? "light" : "dark"))} className="h-14 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-500">
                <span className="inline-flex items-center gap-2">
                  {posTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {posTheme === "dark" ? "Light" : "Dark"}
                </span>
              </button>
              <button type="button" onClick={goFullscreen} className="h-14 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-500">
                <span className="inline-flex items-center gap-2"><Expand className="h-4 w-4" />Fullscreen</span>
              </button>
              <div className="h-14 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-xs font-black uppercase tracking-widest text-zinc-600 flex items-center dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">Holds: {heldOrders.length}</div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((item, idx) => (
                <button key={item.id} type="button" onClick={() => addToCart(item)} className={cn("h-10 rounded-lg border px-3 text-xs font-bold", idx === activeSuggestionIndex ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500")}>
                  {item.name} ({item.sku})
                </button>
              ))}
            </div>
          )}
        </header>

        <main className="grid min-h-0 grid-cols-1 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="min-h-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button key={category} type="button" onClick={() => setActiveCategory(category)} className={cn("h-12 min-w-max rounded-xl px-4 text-xs font-black uppercase tracking-[0.14em]", activeCategory === category ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800")}>
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-full overflow-auto p-3">
              {filteredProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4">
                  <p className="text-sm font-semibold text-zinc-700">No results.</p>
                  <p className="text-xs text-zinc-500">Add manual item for this transaction.</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_auto]">
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Custom item name" className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500" />
                    <input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="Price" inputMode="decimal" className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500" />
                    <button type="button" onClick={addManualItem} className="h-11 rounded-lg bg-emerald-600 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-500">Add</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
                  {filteredProducts.map((item) => {
                    const price = Number(item.sell_price || item.buy_price || 0)
                    return (
                      <button key={item.id} type="button" onClick={() => addToCart(item)} className="min-h-[120px] rounded-xl border-2 border-zinc-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:shadow-md">
                        <p className="line-clamp-2 text-sm font-extrabold leading-tight text-zinc-900">{item.name}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.sku}</p>
                        <div className="mt-3 flex items-end justify-between">
                          <p className="text-xl font-black text-zinc-900">Rs {price.toFixed(2)}</p>
                          <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase", item.stock > (item.min_stock || 5) ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{item.stock}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="min-h-0 bg-white dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Current Order</h2>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
              </div>
            </div>

            <div className="h-[calc(100%-268px)] overflow-auto p-3">
              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">Select products to begin billing.</div>
              ) : (
                <div className="space-y-2">
                  {cart.map((line) => {
                    const t = lineTotals(line)
                    return (
                      <div key={line.id} className={cn("rounded-xl border border-zinc-200 p-3", lineFlashId === line.id && "border-emerald-500 bg-emerald-50")}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-zinc-900">{line.item.name}</p>
                            <p className="text-[11px] font-semibold text-zinc-500">Tax {Number(line.item.gst_percentage || 0).toFixed(0)}% | Rs {line.price.toFixed(2)}</p>
                          </div>
                          <button type="button" onClick={() => removeLine(line.id)} className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="mx-auto h-4 w-4" /></button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex h-11 items-center rounded-lg border border-zinc-200">
                            <button type="button" onClick={() => updateQty(line.id, line.qty - 1)} className="h-11 w-11 bg-zinc-100 hover:bg-zinc-200"><Minus className="mx-auto h-4 w-4" /></button>
                            <input value={line.qty} onChange={(e) => { const next = Number.parseInt(e.target.value || "0", 10); if (!Number.isFinite(next)) return; updateQty(line.id, next) }} inputMode="numeric" className="h-11 w-14 border-x border-zinc-200 text-center text-sm font-black outline-none" />
                            <button type="button" onClick={() => updateQty(line.id, line.qty + 1)} className="h-11 w-11 bg-zinc-100 hover:bg-zinc-200"><Plus className="mx-auto h-4 w-4" /></button>
                          </div>
                          <p className="text-sm font-black text-zinc-900">Rs {t.total.toFixed(2)}</p>
                        </div>
                        <input value={line.note} onChange={(e) => updateLineNote(line.id, e.target.value)} placeholder="Add note" className="mt-2 h-9 w-full rounded-lg border border-zinc-200 px-3 text-xs outline-none focus:border-zinc-400" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-2">
                <input value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} inputMode="decimal" placeholder="Discount %" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                <input value={customerGst} onChange={(e) => setCustomerGst(e.target.value.toUpperCase())} maxLength={15} placeholder="Customer GSTIN" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
              </div>
              {heldOrders.length > 0 && (
                <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Resume Hold</p>
                  <div className="flex flex-wrap gap-1.5">
                    {heldOrders.slice(0, 4).map((order) => (
                      <button key={order.id} type="button" onClick={() => resumeOrder(order.id)} className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 text-[11px] font-bold hover:border-zinc-500"><FolderOpen className="h-3.5 w-3.5" />{order.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </main>

        <footer className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subtotal</p><p className="text-lg font-black text-zinc-900">Rs {totals.subtotal.toFixed(2)}</p></div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tax {effectiveTaxRate.toFixed(1)}%</p><p className="text-lg font-black text-zinc-900">Rs {totals.tax.toFixed(2)}</p></div>
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total</p><p className="text-xl font-black text-emerald-800">Rs {totals.total.toFixed(2)}</p></div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PAYMENT_METHODS.map((method) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={cn("h-14 rounded-xl border text-xs font-black uppercase tracking-[0.14em] transition", paymentMethod === method ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500")}>{method}</button>
                ))}
                <button type="button" onClick={holdOrder} className="h-14 rounded-xl border border-amber-300 bg-amber-50 text-xs font-black uppercase tracking-[0.14em] text-amber-800 hover:bg-amber-100"><span className="inline-flex items-center gap-2"><Save className="h-4 w-4" />Hold</span></button>
              </div>

              {paymentMethod === "Split" && (
                <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 sm:grid-cols-4">
                  <input value={splitCash} onChange={(e) => setSplitCash(e.target.value)} placeholder="Cash" inputMode="decimal" className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500" />
                  <input value={splitCard} onChange={(e) => setSplitCard(e.target.value)} placeholder="Card" inputMode="decimal" className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500" />
                  <input value={splitUpi} onChange={(e) => setSplitUpi(e.target.value)} placeholder="UPI" inputMode="decimal" className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500" />
                  <div className="h-10 rounded-md border border-zinc-300 bg-white px-3 py-1.5"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Remaining</p><p className={cn("text-sm font-black", Math.abs(splitRemaining) < 0.01 ? "text-emerald-700" : "text-rose-600")}>Rs {splitRemaining.toFixed(2)}</p></div>
                </div>
              )}

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input value={holdName} onChange={(e) => setHoldName(e.target.value)} placeholder="Hold order label (optional)" className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                <button type="button" onClick={() => setShowNumpad(true)} className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-xs font-black uppercase tracking-widest text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500">Custom Amount</button>
                <button type="button" onClick={completeSale} disabled={cart.length === 0 || isSubmitting} className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-black uppercase tracking-wide text-white hover:bg-emerald-500 disabled:opacity-50">{isSubmitting ? "Processing..." : "Pay"}</button>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 xl:w-[320px] dark:border-zinc-700 dark:bg-zinc-950">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Amount Paid</p>
              <p className="mt-1 text-3xl font-black text-zinc-900">Rs {tendered.toFixed(2)}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md border border-zinc-200 bg-white p-2"><p className="font-semibold text-zinc-500">Total</p><p className="font-black text-zinc-900">Rs {totals.total.toFixed(2)}</p></div>
                <div className="rounded-md border border-zinc-200 bg-white p-2"><p className="font-semibold text-zinc-500">Paid</p><p className="font-black text-zinc-900">Rs {tendered.toFixed(2)}</p></div>
                <div className="rounded-md border border-zinc-200 bg-white p-2"><p className="font-semibold text-zinc-500">Change</p><p className="font-black text-emerald-700">Rs {change.toFixed(2)}</p></div>
              </div>
            </div>
          </div>

          {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
        </footer>
      </div>

      {showNumpad && (
        <Numpad title="Amount Paid" total={totals.total} onCancel={() => setShowNumpad(false)} onConfirm={(amount) => { setTendered(amount); setShowNumpad(false) }} />
      )}
    </div>
  )
}

