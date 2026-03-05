"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { InventoryItem } from "@/lib/types"
import { recordBatchSales } from "@/lib/data/sales"
import { cn } from "@/lib/utils"
import { SignatureReceipt } from "@/components/ui/signature-receipt"
import { useInventoryCache } from "@/hooks/use-inventory-cache"
import { useSync } from "@/hooks/use-sync"
import { useHaptic } from "@/hooks/use-haptic"
import { Numpad } from "@/components/pos/numpad"
import {
  Minus,
  Plus,
  Search,
  Trash2,
  ScanLine,
  Save,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type PaymentMethod = "Cash" | "UPI" | "Card" | "Split"

type CartItem = {
  id: string
  inventoryItem: InventoryItem
  quantity: number
  unitPrice: number
  note: string
}

type HeldOrder = {
  id: string
  label: string
  createdAt: string
  cart: CartItem[]
  customerName: string
  customerPhone: string
  customerGst: string
  paymentMethod: PaymentMethod
  discountPercent: number
  splitCash: number
  splitCard: number
  splitUpi: number
  tenderedAmount: number
}

interface SalesFormProps {
  inventory: InventoryItem[]
  userId: string
  gstInclusive: boolean
  gstEnabled: boolean
  showBuyPrice?: boolean
  orgId: string
  org?: { name: string; gstin?: string; upi_id?: string; plan_type?: string }
}

const PAYMENT_BUTTONS: Array<{ method: PaymentMethod; label: string }> = [
  { method: "Cash", label: "Cash" },
  { method: "Card", label: "Card" },
  { method: "UPI", label: "UPI" },
  { method: "Split", label: "Split" },
]

export function SalesFormPos({ inventory, userId, gstInclusive, gstEnabled, orgId, org }: SalesFormProps) {
  const router = useRouter()
  const { inventory: inventorySource, isOnline, applyLocalSale } = useInventoryCache(inventory, orgId)
  const { addToQueue } = useSync()
  const { trigger: haptic } = useHaptic()

  const searchRef = useRef<HTMLInputElement | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [discountPercent, setDiscountPercent] = useState("0")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerGst, setCustomerGst] = useState("")
  const [showGstUpgradeWall, setShowGstUpgradeWall] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash")
  const [splitCash, setSplitCash] = useState("")
  const [splitCard, setSplitCard] = useState("")
  const [splitUpi, setSplitUpi] = useState("")
  const [tenderedAmount, setTenderedAmount] = useState(0)
  const [showNumpad, setShowNumpad] = useState(false)
  const [manualPrice, setManualPrice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [holdName, setHoldName] = useState("")
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [showHeldPanel, setShowHeldPanel] = useState(false)
  const [showShortcutPanel, setShowShortcutPanel] = useState(false)
  const [orderNumber, setOrderNumber] = useState(() => 1000 + Math.floor(Math.random() * 9000))
  const [productPulseId, setProductPulseId] = useState<string | null>(null)
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null)
  const [successReceipt, setSuccessReceipt] = useState<{
    amount: number
    paymentMethod: PaymentMethod
    paymentStatus: "pending" | "paid" | "failed"
    itemCount: number
  } | null>(null)
  const normalizedPlanType = String(org?.plan_type || "free").toLowerCase()
  const isKeepPlan = normalizedPlanType === "free" || normalizedPlanType === "keep"

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of inventorySource) {
      if (item.category) set.add(item.category)
    }
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

  const shortcutProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return filteredProducts.slice(0, 1)
    return filteredProducts.slice(0, 8)
  }, [filteredProducts, searchQuery])

  const discountNum = useMemo(() => {
    const parsed = Number.parseFloat(discountPercent)
    if (!Number.isFinite(parsed)) return 0
    return Math.min(100, Math.max(0, parsed))
  }, [discountPercent])

  const categoryColors: Record<string, { bg: string; text: string; border: string; glow: string }> = useMemo(() => {
    const palette = [
      { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", glow: "shadow-blue-500/20" },
      { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
      { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
      { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", glow: "shadow-rose-500/20" },
      { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30", glow: "shadow-indigo-500/20" },
      { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-emerald-500/20" },
      { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30", glow: "shadow-cyan-500/20" },
      { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", glow: "shadow-orange-500/20" },
    ]
    const mapping: Record<string, (typeof palette)[0]> = {
      All: { bg: "bg-zinc-800/50", text: "text-zinc-400", border: "border-zinc-700/50", glow: "shadow-zinc-900/10" },
    }
    categories.forEach((cat, i) => {
      if (cat !== "All") {
        mapping[cat] = palette[(i - 1) % palette.length]
      }
    })
    return mapping
  }, [categories])

  const discountMultiplier = 1 - discountNum / 100

  const lineCalculator = useCallback(
    (line: CartItem) => {
      const qty = Math.max(1, line.quantity)
      const discountedUnit = line.unitPrice * discountMultiplier

      if (!gstEnabled) {
        const subtotal = qty * discountedUnit
        return { subtotal, tax: 0, total: subtotal, effectiveUnit: discountedUnit }
      }

      const rate = Math.max(0, Number(line.inventoryItem.gst_percentage || 0)) / 100
      if (gstInclusive) {
        const total = qty * discountedUnit
        const subtotal = total / (1 + rate)
        const tax = total - subtotal
        return { subtotal, tax, total, effectiveUnit: discountedUnit }
      }

      const subtotal = qty * discountedUnit
      const tax = subtotal * rate
      const total = subtotal + tax
      return { subtotal, tax, total, effectiveUnit: discountedUnit }
    },
    [discountMultiplier, gstEnabled, gstInclusive]
  )

  const totals = useMemo(() => {
    return cart.reduce(
      (acc, line) => {
        const lineTotals = lineCalculator(line)
        acc.subtotal += lineTotals.subtotal
        acc.tax += lineTotals.tax
        acc.total += lineTotals.total
        return acc
      },
      { subtotal: 0, tax: 0, total: 0 }
    )
  }, [cart, lineCalculator])

  const effectiveTaxRate = totals.subtotal > 0 ? (totals.tax / totals.subtotal) * 100 : 0

  const splitCashNum = Number.parseFloat(splitCash || "0") || 0
  const splitCardNum = Number.parseFloat(splitCard || "0") || 0
  const splitUpiNum = Number.parseFloat(splitUpi || "0") || 0
  const splitTotal = splitCashNum + splitCardNum + splitUpiNum
  const splitRemaining = totals.total - splitTotal

  const changeAmount = Math.max(0, tenderedAmount - totals.total)

  const heldKey = `khataplus_held_carts_${orgId}`

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

  const persistHeldOrders = useCallback(
    (next: HeldOrder[]) => {
      setHeldOrders(next)
      localStorage.setItem(heldKey, JSON.stringify(next))
    },
    [heldKey]
  )

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (cart.length === 0) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [cart.length])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName || ""
      const isTypingContext = tag === "INPUT" || tag === "TEXTAREA"

      if (event.key === "F2" || (event.key === "/" && !isTypingContext)) {
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
        } else if (cart.length > 0) {
          (document.activeElement as HTMLElement)?.blur()
        }
      }

      if (event.key === "Enter" && !isTypingContext && !showNumpad) {
        if (cart.length > 0) {
          setShowNumpad(true)
        }
      }

      if (!isTypingContext && /^[1-9]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (cart.length > 0) {
          const lastItem = cart[cart.length - 1]
          updateQty(lastItem.id, parseInt(event.key))
          setTransientHighlight(lastItem.id)
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [searchQuery, showNumpad])

  const setTransientHighlight = (lineId: string) => {
    setHighlightedLineId(lineId)
    window.setTimeout(() => setHighlightedLineId((curr) => (curr === lineId ? null : curr)), 280)
  }

  const addToCart = (item: InventoryItem, quantity = 1, unitPrice?: number) => {
    const resolvedPrice = Number.isFinite(unitPrice) && (unitPrice || 0) > 0
      ? Number(unitPrice)
      : Number(item.sell_price || item.buy_price || 0)

    if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
      setError("Set a valid item price before adding.")
      return
    }

    const available = Number(item.stock || 0)
    setCart((prev) => {
      const existingIdx = prev.findIndex((line) => line.inventoryItem.id === item.id && line.unitPrice === resolvedPrice)
      if (existingIdx === -1) {
        const lineId = `${item.id}:${resolvedPrice}`
        setTransientHighlight(lineId)
        return [
          ...prev,
          {
            id: lineId,
            inventoryItem: item,
            quantity,
            unitPrice: resolvedPrice,
            note: "",
          },
        ]
      }

      const existing = prev[existingIdx]
      const nextQty = existing.quantity + quantity
      if (item.id.startsWith("manual-") || nextQty <= available) {
        const cloned = [...prev]
        cloned[existingIdx] = { ...existing, quantity: nextQty }
        setTransientHighlight(existing.id)
        return cloned
      }
      setError(`Only ${available} units available for ${item.name}.`)
      return prev
    })

    setError(null)
    setProductPulseId(item.id)
    window.setTimeout(() => {
      setProductPulseId((curr) => (curr === item.id ? null : curr))
    }, 240)
    haptic("light")
  }

  const updateQty = (lineId: string, nextQty: number) => {
    setCart((prev) => {
      if (nextQty <= 0) return prev.filter((line) => line.id !== lineId)
      return prev.map((line) => {
        if (line.id !== lineId) return line
        const stock = Number(line.inventoryItem.stock || 0)
        const clamped = line.inventoryItem.id.startsWith("manual-") ? nextQty : Math.min(nextQty, stock)
        return { ...line, quantity: Math.max(1, clamped) }
      })
    })
  }

  const removeLine = (lineId: string) => {
    setCart((prev) => prev.filter((line) => line.id !== lineId))
    haptic("warning")
  }

  const setLineNote = (lineId: string, note: string) => {
    setCart((prev) => prev.map((line) => (line.id === lineId ? { ...line, note } : line)))
  }

  const handleSearchSubmit = () => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return

    const exact = inventorySource.find((item) => item.sku.toLowerCase() === query || item.name.toLowerCase() === query)
    if (exact) {
      addToCart(exact, 1)
      setSearchQuery("")
      setActiveSuggestionIndex(0)
      return
    }

    const highlighted = shortcutProducts[activeSuggestionIndex] || shortcutProducts[0]
    if (highlighted) {
      addToCart(highlighted, 1)
      setSearchQuery("")
      setActiveSuggestionIndex(0)
      return
    }

    setError("No matching product found. Use manual item if needed.")
  }

  const addManualItem = () => {
    const name = searchQuery.trim()
    const price = Number.parseFloat(manualPrice)

    if (!name) {
      setError("Enter a product name for manual item.")
      return
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid manual price.")
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
      category: "Manual",
      created_at: now,
      updated_at: now,
    }

    addToCart(item, 1, price)
    setSearchQuery("")
    setManualPrice("")
  }

  const clearOrderState = () => {
    setCart([])
    setSearchQuery("")
    setCustomerName("")
    setCustomerPhone("")
    setCustomerGst("")
    setPaymentMethod("Cash")
    setDiscountPercent("0")
    setSplitCash("")
    setSplitCard("")
    setSplitUpi("")
    setTenderedAmount(0)
    setHoldName("")
    setManualPrice("")
    setOrderNumber((prev) => prev + 1)
  }

  const holdCurrentOrder = () => {
    if (cart.length === 0) {
      setError("Add items before holding an order.")
      return
    }

    const hold: HeldOrder = {
      id: crypto.randomUUID(),
      label: holdName.trim() || `Order ${new Date().toLocaleTimeString()}`,
      createdAt: new Date().toISOString(),
      cart,
      customerName,
      customerPhone,
      customerGst,
      paymentMethod,
      discountPercent: discountNum,
      splitCash: splitCashNum,
      splitCard: splitCardNum,
      splitUpi: splitUpiNum,
      tenderedAmount,
    }

    persistHeldOrders([hold, ...heldOrders].slice(0, 25))
    clearOrderState()
    setError(null)
  }

  const resumeHeldOrder = (orderId: string) => {
    const match = heldOrders.find((order) => order.id === orderId)
    if (!match) return

    setCart(match.cart)
    setCustomerName(match.customerName)
    setCustomerPhone(match.customerPhone)
    setCustomerGst(match.customerGst)
    setPaymentMethod(match.paymentMethod)
    setDiscountPercent(String(match.discountPercent || 0))
    setSplitCash(match.splitCash > 0 ? String(match.splitCash) : "")
    setSplitCard(match.splitCard > 0 ? String(match.splitCard) : "")
    setSplitUpi(match.splitUpi > 0 ? String(match.splitUpi) : "")
    setTenderedAmount(match.tenderedAmount || 0)
    persistHeldOrders(heldOrders.filter((order) => order.id !== orderId))
    setError(null)
  }

  const submitSale = async () => {
    if (isSubmitting) return
    if (!userId) {
      setError("You must be logged in to complete checkout.")
      return
    }
    if (cart.length === 0) {
      setError("Add products before checkout.")
      return
    }
    if (paymentMethod === "Split" && Math.abs(splitRemaining) > 0.01) {
      setError("Split payment must match total amount.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const submissionKey = `sale_${Date.now()}_${crypto.randomUUID()}`

      const payload = cart.map((line) => {
        const lineTotals = lineCalculator(line)
        const paymentStatus: "pending" | "paid" = paymentMethod === "UPI" ? "pending" : "paid"

        return {
          inventory_id: line.inventoryItem.id,
          quantity: line.quantity,
          sale_price: Number(lineTotals.effectiveUnit.toFixed(2)),
          total_amount: Number(lineTotals.total.toFixed(2)),
          gst_amount: Number(lineTotals.tax.toFixed(2)),
          profit: Number(((lineTotals.effectiveUnit - Number(line.inventoryItem.buy_price || 0)) * line.quantity).toFixed(2)),
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          customer_gstin: isKeepPlan ? undefined : customerGst || undefined,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
        }
      })

      if (!isOnline) {
        await addToQueue({
          url: "/api/sales",
          method: "POST",
          body: { sales: payload, orgId, idempotencyKey: submissionKey },
        })

        await applyLocalSale(
          payload.map((sale) => ({
            inventory_id: sale.inventory_id,
            quantity: sale.quantity,
          }))
        )
      } else {
        await recordBatchSales(payload as any, orgId, submissionKey)
      }

      setSuccessReceipt({
        amount: Number(totals.total.toFixed(2)),
        itemCount: cart.length,
        paymentMethod,
        paymentStatus: paymentMethod === "UPI" ? "pending" : "paid",
      })
      clearOrderState()
      haptic("success")
    } catch (e: any) {
      const message = String(e?.message || "Unable to complete sale.")
      if (/insufficient stock/i.test(message)) {
        setError("Stock changed during checkout. Adjust quantity and retry.")
      } else {
        setError(message.replace(/^Error:\s*/i, "").replace(/^Batch Transaction Failed:\s*/i, "").trim())
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successReceipt) {
    return (
      <SignatureReceipt
        amount={successReceipt.amount}
        customerName={customerName || "Walk-in Customer"}
        customerPhone={customerPhone}
        shopName={org?.name || "My Shop"}
        upiId={org?.upi_id}
        paymentMethod={successReceipt.paymentMethod}
        paymentStatus={successReceipt.paymentStatus}
        itemCount={successReceipt.itemCount}
        onClose={() => setSuccessReceipt(null)}
        onNewSale={() => {
          setSuccessReceipt(null)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-8%] h-[40vh] w-[40vw] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute -right-20 bottom-[-14%] h-[45vh] w-[36vw] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <header className="border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
                <span className="text-white">KhataPlus</span>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-400">POS Terminal</span>
              </div>
            </div>

            <div className="group relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setActiveSuggestionIndex(0)
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    setActiveSuggestionIndex((prev) => (prev + 1) % Math.max(1, shortcutProducts.length))
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault()
                    setActiveSuggestionIndex((prev) => (prev <= 0 ? Math.max(0, shortcutProducts.length - 1) : prev - 1))
                  }
                  if (event.key === "Enter") {
                    event.preventDefault()
                    handleSearchSubmit()
                  }
                }}
                placeholder="Search / scan products..."
                className="h-14 w-full rounded-2xl border border-white/15 bg-white/5 pl-12 pr-28 text-sm font-bold text-white outline-none transition focus:border-emerald-400/60 focus:bg-white/10"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                F2 or /
              </div>
            </div>

            <div className="relative flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowHeldPanel((prev) => !prev)
                  setShowShortcutPanel(false)
                }}
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-[11px] font-black uppercase tracking-widest text-zinc-200 transition hover:border-emerald-400/40 hover:bg-white/10"
              >
                Hold Order ({heldOrders.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowShortcutPanel((prev) => !prev)
                  setShowHeldPanel(false)
                }}
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-[11px] font-black uppercase tracking-widest text-zinc-200 transition hover:border-cyan-400/40 hover:bg-white/10"
              >
                Shortcuts
              </button>

              {showHeldPanel && (
                <div className="absolute right-0 top-14 z-20 w-80 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Held Orders</p>
                    <button
                      type="button"
                      onClick={holdCurrentOrder}
                      className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25"
                    >
                      Hold Current
                    </button>
                  </div>
                  {heldOrders.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-xs font-semibold text-zinc-400">No held orders.</p>
                  ) : (
                    <div className="max-h-72 space-y-2 overflow-auto pr-1">
                      {heldOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => {
                            resumeHeldOrder(order.id)
                            setShowHeldPanel(false)
                          }}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-emerald-400/40 hover:bg-white/10"
                        >
                          <p className="text-xs font-black text-white">{order.label}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {order.cart.length} items • {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showShortcutPanel && (
                <div className="absolute right-0 top-14 z-20 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Keyboard</p>
                  <div className="space-y-2 text-xs font-semibold text-zinc-300">
                    <p><span className="text-zinc-500">F2 /</span> Focus search</p>
                    <p><span className="text-zinc-500">Enter</span> Open pay modal</p>
                    <p><span className="text-zinc-500">Esc</span> Clear search/close modal</p>
                    <p><span className="text-zinc-500">1-9</span> Set qty on last cart item</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {shortcutProducts.length > 0 && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-2 flex flex-wrap gap-2"
              >
                {shortcutProducts.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item, 1)}
                    className={cn(
                      "h-10 rounded-xl border px-3 text-xs font-black uppercase tracking-wider transition",
                      index === activeSuggestionIndex
                        ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[1.45fr_0.95fr]">
          <section className="min-h-0 border-r border-white/10 bg-zinc-950/40">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "h-11 shrink-0 rounded-full border px-5 text-[11px] font-black uppercase tracking-wider transition",
                      activeCategory === category
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
                        : "border-white/15 bg-white/5 text-zinc-300 hover:border-white/30 hover:bg-white/10"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-full overflow-auto p-4">
              {filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                  <Search className="mx-auto mb-3 h-10 w-10 text-zinc-500" />
                  <h3 className="text-lg font-black text-white">No products found</h3>
                  <p className="mt-1 text-sm text-zinc-400">Add custom line item quickly.</p>
                  <div className="mx-auto mt-6 grid max-w-2xl gap-3 md:grid-cols-[1fr_160px_auto]">
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Item name"
                      className="h-12 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white outline-none focus:border-emerald-400/60"
                    />
                    <input
                      value={manualPrice}
                      onChange={(event) => setManualPrice(event.target.value)}
                      placeholder="Price"
                      inputMode="decimal"
                      className="h-12 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white outline-none focus:border-emerald-400/60"
                    />
                    <button
                      type="button"
                      onClick={addManualItem}
                      className="h-12 rounded-xl bg-emerald-500 px-6 text-xs font-black uppercase tracking-widest text-black transition hover:bg-emerald-400"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((item) => {
                      const price = Number(item.sell_price || item.buy_price || 0)
                      const categoryEmoji = item.category?.toLowerCase().includes("drink")
                        ? "🥤"
                        : item.category?.toLowerCase().includes("food")
                          ? "🍽️"
                          : item.category?.toLowerCase().includes("dessert")
                            ? "🧁"
                            : "🛍️"

                      return (
                        <motion.button
                          layout
                          key={item.id}
                          type="button"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          whileHover={{ y: -4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => addToCart(item, 1)}
                          className={cn(
                            "group min-h-[132px] rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-lg transition",
                            productPulseId === item.id && "border-emerald-400/70 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.35)]"
                          )}
                        >
                          <p className="text-lg">{categoryEmoji}</p>
                          <p className="mt-2 line-clamp-2 text-sm font-black text-zinc-100">{item.name}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xl font-black italic text-white">₹{price.toLocaleString("en-IN")}</p>
                            <span className={cn(
                              "rounded-full px-2 py-1 text-[10px] font-black uppercase",
                              item.stock > (item.min_stock || 5) ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                            )}>
                              {item.stock}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </section>

          <aside className="flex min-h-0 flex-col bg-zinc-950/70 p-4 backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Current Order</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-white">#{orderNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={holdCurrentOrder}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:bg-white/15"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Hold
                  </span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Customer"
                  className="h-10 rounded-xl border border-white/15 bg-zinc-900/70 px-3 text-sm font-semibold text-white outline-none focus:border-emerald-400/60"
                />
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Phone"
                  className="h-10 rounded-xl border border-white/15 bg-zinc-900/70 px-3 text-sm font-semibold text-white outline-none focus:border-emerald-400/60"
                />
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5 p-3">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-zinc-900/40 p-6 text-center">
                  <ScanLine className="mb-3 h-10 w-10 text-zinc-500" />
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Add items to start billing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {cart.map((line) => {
                      const lineTotals = lineCalculator(line)
                      return (
                        <motion.div
                          key={line.id}
                          layout
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          className={cn(
                            "rounded-xl border border-white/10 bg-zinc-900/70 p-3 transition",
                            highlightedLineId === line.id && "border-emerald-400/50 bg-emerald-500/10"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-white">{line.inventoryItem.name}</p>
                              <p className="text-xs font-semibold text-zinc-400">₹{line.unitPrice.toFixed(2)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLine(line.id)}
                              className="rounded-lg border border-rose-400/20 bg-rose-500/15 p-1.5 text-rose-300 hover:bg-rose-500/25"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-lg border border-white/15 bg-black/30">
                              <button type="button" onClick={() => updateQty(line.id, line.quantity - 1)} className="h-8 w-8">
                                <Minus className="mx-auto h-4 w-4 text-zinc-200" />
                              </button>
                              <input
                                value={line.quantity}
                                onChange={(event) => {
                                  const next = Number.parseInt(event.target.value || "0", 10)
                                  if (!Number.isFinite(next)) return
                                  updateQty(line.id, next)
                                }}
                                className="h-8 w-10 bg-transparent text-center text-sm font-black text-white outline-none"
                                inputMode="numeric"
                              />
                              <button type="button" onClick={() => updateQty(line.id, line.quantity + 1)} className="h-8 w-8">
                                <Plus className="mx-auto h-4 w-4 text-zinc-200" />
                              </button>
                            </div>
                            <p className="text-base font-black text-emerald-300">₹{lineTotals.total.toFixed(2)}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-1 text-sm font-bold">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>GST {effectiveTaxRate.toFixed(0)}%</span>
                  <span>₹{totals.tax.toFixed(2)}</span>
                </div>
                <div className="my-2 h-px bg-white/15" />
                <div className="flex items-center justify-between text-lg font-black text-emerald-300">
                  <span>Total</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {PAYMENT_BUTTONS.map(({ method, label }) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "h-12 rounded-xl border text-xs font-black uppercase tracking-widest transition",
                      paymentMethod === method
                        ? method === "Cash"
                          ? "border-emerald-400/70 bg-emerald-500/25 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.35)]"
                          : method === "Card"
                            ? "border-fuchsia-400/70 bg-fuchsia-500/25 text-fuchsia-200 shadow-[0_0_24px_rgba(217,70,239,0.35)]"
                            : method === "UPI"
                              ? "border-amber-400/70 bg-amber-500/25 text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.35)]"
                              : "border-rose-400/70 bg-rose-500/25 text-rose-200 shadow-[0_0_24px_rgba(244,63,94,0.35)]"
                        : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {paymentMethod === "Split" && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <input value={splitCash} onChange={(e) => setSplitCash(e.target.value)} placeholder="Cash" inputMode="decimal" className="h-10 rounded-lg border border-white/15 bg-zinc-900/70 px-2 text-xs font-black text-white outline-none focus:border-emerald-400/60" />
                  <input value={splitCard} onChange={(e) => setSplitCard(e.target.value)} placeholder="Card" inputMode="decimal" className="h-10 rounded-lg border border-white/15 bg-zinc-900/70 px-2 text-xs font-black text-white outline-none focus:border-fuchsia-400/60" />
                  <input value={splitUpi} onChange={(e) => setSplitUpi(e.target.value)} placeholder="UPI" inputMode="decimal" className="h-10 rounded-lg border border-white/15 bg-zinc-900/70 px-2 text-xs font-black text-white outline-none focus:border-amber-400/60" />
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={discountPercent}
                  onChange={(event) => setDiscountPercent(event.target.value)}
                  placeholder="Discount %"
                  inputMode="decimal"
                  className="h-10 rounded-lg border border-white/15 bg-zinc-900/70 px-3 text-xs font-black text-white outline-none focus:border-emerald-400/60"
                />
                <input
                  value={customerGst}
                  readOnly={isKeepPlan}
                  onFocus={() => {
                    if (isKeepPlan) setShowGstUpgradeWall(true)
                  }}
                  onChange={(event) => {
                    const nextValue = event.target.value.toUpperCase()
                    if (isKeepPlan && nextValue.length > 0) {
                      setShowGstUpgradeWall(true)
                      return
                    }
                    setCustomerGst(nextValue)
                  }}
                  placeholder={isKeepPlan ? "Upgrade for GST" : "GSTIN"}
                  maxLength={15}
                  className="h-10 rounded-lg border border-white/15 bg-zinc-900/70 px-3 text-xs font-black text-white outline-none focus:border-emerald-400/60"
                />
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || isSubmitting}
                onClick={() => setShowNumpad(true)}
                data-submit-sale="true"
                className="mt-4 h-14 w-full rounded-xl bg-emerald-500 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_0_35px_rgba(16,185,129,0.45)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : `Pay Now ₹${totals.total.toFixed(2)}`}
              </button>

              <div className="mt-3 flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Tendered: ₹{tenderedAmount.toFixed(2)}</span>
                <span className={changeAmount >= 0 ? "text-emerald-300" : "text-rose-300"}>Change: ₹{changeAmount.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200">
                {error}
              </p>
            )}
          </aside>
        </main>
      </div>

      {showGstUpgradeWall && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950/95 p-6 text-center">
            <p className="text-sm font-black text-white">GST entry is available on paid plans.</p>
            <p className="mt-1 text-xs font-semibold text-zinc-400">Upgrade to unlock customer GST capture in POS.</p>
            <button
              type="button"
              onClick={() => setShowGstUpgradeWall(false)}
              className="mt-4 h-11 rounded-xl border border-white/20 bg-white/10 px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showNumpad && (
        <Numpad
          title="Amount Tendered"
          total={totals.total}
          onCancel={() => {
            setShowNumpad(false)
            searchRef.current?.focus()
          }}
          onConfirm={(amount) => {
            setTenderedAmount(amount)
            setShowNumpad(false)
            void submitSale()
          }}
        />
      )}
    </div>
  )
}
