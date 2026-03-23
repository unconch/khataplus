"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { InventoryItem } from "@/lib/types"
import Link from "next/link"
import { ArrowLeft, Search, X, Minus, Plus, CreditCard, BadgeIndianRupee, Smartphone, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

type PosTerminalProps = {
  inventory: InventoryItem[]
  userId: string
  orgId: string
  org: { name: string; gstin?: string; upi_id?: string }
  gstInclusive: boolean
  gstEnabled: boolean
}

type PaymentMethod = "Cash" | "UPI" | "Card" | "Credit"

type CartItem = {
  id: string
  name: string
  qty: number
  stock: number
  unitPrice: number
  gstPercentage: number
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number.isFinite(value) ? value : 0
  )
}

function toSalePrice(item: InventoryItem) {
  const sell = Number(item.sell_price ?? 0)
  if (sell > 0) return sell
  const buy = Number(item.buy_price ?? 0)
  return buy > 0 ? buy : 0
}

export function PosTerminal({ inventory, orgId, gstEnabled }: PosTerminalProps) {
  const [query, setQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // "/" focuses search unless typing in an input already
      if (e.key !== "/") return
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || (target as any).isContentEditable)
      if (isTyping) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inventory
    return inventory.filter((i) => i.name.toLowerCase().includes(q) || String(i.sku || "").toLowerCase().includes(q))
  }, [inventory, query])

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
    const gstAmount = gstEnabled
      ? cart.reduce((sum, i) => sum + (i.unitPrice * i.qty * Number(i.gstPercentage || 0)) / 100, 0)
      : 0
    return { subtotal, gstAmount, grandTotal: subtotal + gstAmount }
  }, [cart, gstEnabled])

  function addItem(item: InventoryItem) {
    const unitPrice = toSalePrice(item)
    if (unitPrice <= 0) return

    setSuccess("")
    setError("")
    setCart((prev) => {
      const existing = prev.find((x) => x.id === item.id)
      if (existing) {
        if (existing.qty >= existing.stock) return prev
        return prev.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x))
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          qty: 1,
          stock: Number(item.stock || 0),
          unitPrice,
          gstPercentage: Number(item.gst_percentage || 0),
        },
      ]
    })
  }

  function changeQty(id: string, nextQty: number) {
    setCart((prev) =>
      prev
        .map((x) => {
          if (x.id !== id) return x
          const qty = Math.max(0, Math.min(nextQty, x.stock))
          return { ...x, qty }
        })
        .filter((x) => x.qty > 0)
    )
  }

  function resetSale() {
    setCart([])
    setCustomerName("")
    setCustomerPhone("")
    setPaymentMethod("Cash")
    setError("")
    setSuccess("")
    setQuery("")
    searchRef.current?.focus()
  }

  async function checkout() {
    if (cart.length === 0 || submitting) return
    setSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const sales = cart.map((item) => {
        const base = item.unitPrice * item.qty
        const gstAmount = gstEnabled ? (base * item.gstPercentage) / 100 : 0
        return {
          inventory_id: item.id,
          quantity: item.qty,
          sale_price: item.unitPrice,
          total_amount: base + gstAmount,
          gst_amount: gstAmount,
          profit: 0,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "Credit" ? "pending" : "paid",
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
        }
      })

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales,
          orgId,
          idempotencyKey: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        throw new Error(data?.error || "Failed to record sale")
      }
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setSuccess("Sale recorded successfully.")
    } catch (e: any) {
      setError(e?.message || "Failed to complete checkout")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-svh w-full overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-sky-50/60 text-zinc-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-80px] h-[420px] w-[420px] rounded-full bg-emerald-200/45 blur-[140px]" />
        <div className="absolute right-[-140px] top-10 h-[520px] w-[520px] rounded-full bg-sky-200/45 blur-[170px]" />
        <div className="absolute left-1/2 bottom-[-220px] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-violet-200/35 blur-[220px]" />
      </div>

      <div className="relative h-svh grid grid-rows-[auto_1fr]">
        <header className="px-4 sm:px-6 py-3 border-b border-white/70 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[1600px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <BadgeIndianRupee className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black tracking-tight truncate">POS Terminal</p>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    Live
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 truncate">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="truncate">Ready to bill</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetSale}
                className="hidden sm:inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-zinc-800 hover:bg-zinc-50"
              >
                New Sale
              </button>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 text-[11px] font-black uppercase tracking-widest text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="h-full overflow-hidden px-4 sm:px-6 py-4">
          <div className="mx-auto h-full w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-4">
            <section className="h-full min-h-0 rounded-[26px] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_25px_70px_-45px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100/70">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder='Search items (press "/")'
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-10 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-zinc-500" />
                      </button>
                    ) : null}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 h-12">
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Items</span>
                    <span className="text-sm font-black text-zinc-900 tabular-nums">{filtered.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filtered.map((item) => {
                    const price = toSalePrice(item)
                    const disabled = Number(item.stock || 0) <= 0 || price <= 0
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => addItem(item)}
                        className={cn(
                          "group text-left rounded-[22px] border p-4 transition shadow-sm",
                          disabled
                            ? "border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed"
                            : "border-zinc-200 bg-white hover:bg-emerald-50/40 hover:border-emerald-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-black tracking-tight truncate text-zinc-900">{item.name}</p>
                            <p className="text-[11px] font-semibold text-zinc-500 truncate">SKU {item.sku || "-"}</p>
                          </div>
                          <span className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border",
                            Number(item.stock || 0) > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-500"
                          )}>
                            Stock {Number(item.stock || 0)}
                          </span>
                        </div>
                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Price</div>
                            <div className="text-xl font-black text-zinc-950">{formatINR(price)}</div>
                          </div>
                          <div className={cn(
                            "h-10 px-4 rounded-2xl inline-flex items-center justify-center text-[11px] font-black uppercase tracking-widest",
                            disabled ? "bg-zinc-200 text-zinc-500" : "bg-zinc-950 text-white group-hover:bg-emerald-700"
                          )}>
                            Add
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            <aside className="h-full min-h-0 rounded-[26px] border border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_25px_70px_-45px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100/70 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black tracking-tight">Cart</p>
                  <p className="text-[11px] text-zinc-500 font-semibold">Tap items to add. Adjust qty here.</p>
                </div>
                <button
                  type="button"
                  onClick={resetSale}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-zinc-800 hover:bg-zinc-50"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-zinc-200 bg-white p-6 text-center">
                    <p className="text-sm font-black text-zinc-900">No items yet</p>
                    <p className="text-[12px] text-zinc-500 font-semibold mt-1">Search and add products to start a sale.</p>
                  </div>
                ) : null}

                {cart.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black tracking-tight truncate">{item.name}</p>
                        <p className="text-[11px] text-zinc-500 font-semibold">In stock: {item.stock}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Line</div>
                        <div className="text-sm font-black">{formatINR(item.unitPrice * item.qty)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, item.qty - 1)}
                          className="h-10 w-10 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-10 text-center text-base font-black tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, item.qty + 1)}
                          className="h-10 w-10 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeQty(item.id, 0)}
                        className="h-10 px-4 rounded-2xl border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-700 hover:bg-zinc-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-zinc-100/70 bg-white/70 backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold"
                  />
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone"
                    className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold"
                  />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { label: "Cash", icon: BadgeIndianRupee },
                    { label: "UPI", icon: Smartphone },
                    { label: "Card", icon: CreditCard },
                    { label: "Credit", icon: CreditCard },
                  ].map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setPaymentMethod(m.label as PaymentMethod)}
                      className={cn(
                        "h-11 rounded-2xl border text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
                        paymentMethod === m.label
                          ? "border-emerald-200 bg-emerald-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      <m.icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-[22px] border border-zinc-200 bg-white p-4 text-sm">
                  <div className="flex justify-between text-zinc-600 font-semibold"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
                  <div className="flex justify-between text-zinc-600 font-semibold"><span>GST</span><span>{formatINR(totals.gstAmount)}</span></div>
                  <div className="flex justify-between font-black text-lg mt-1"><span>Total</span><span>{formatINR(totals.grandTotal)}</span></div>
                </div>

                {error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}
                {success ? <p className="mt-2 text-sm font-semibold text-emerald-700">{success}</p> : null}

                <button
                  type="button"
                  onClick={checkout}
                  disabled={submitting || cart.length === 0}
                  className="mt-3 h-12 w-full rounded-2xl bg-zinc-950 text-white font-black uppercase tracking-widest disabled:opacity-50 hover:bg-zinc-800"
                >
                  {submitting ? "Processing..." : `Complete Sale · ${formatINR(totals.grandTotal)}`}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
