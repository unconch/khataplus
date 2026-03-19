"use client"

import { useMemo, useState } from "react"
import type { InventoryItem } from "@/lib/types"

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
    <div className="h-full min-h-[calc(100svh-64px)] w-full bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-3 sm:p-4">
      <div className="h-full grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-3">
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 overflow-hidden flex flex-col">
          <div className="mb-3">
            <h2 className="text-xl font-black">POS Terminal</h2>
            <p className="text-xs text-zinc-500">Fast billing with inventory-aware cart</p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item or SKU"
            className="h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 bg-zinc-50 dark:bg-zinc-950 mb-3"
          />
          <div className="flex-1 overflow-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {filtered.map((item) => {
              const disabled = Number(item.stock || 0) <= 0 || toSalePrice(item) <= 0
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => addItem(item)}
                  className="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  <p className="font-bold truncate">{item.name}</p>
                  <p className="text-xs text-zinc-500">SKU: {item.sku || "-"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-black">{formatINR(toSalePrice(item))}</span>
                    <span className="text-xs">Stock {item.stock}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col">
          <h3 className="text-lg font-black mb-3">Cart</h3>
          <div className="space-y-2 overflow-auto flex-1">
            {cart.length === 0 ? <p className="text-sm text-zinc-500">No items selected.</p> : null}
            {cart.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold truncate">{item.name}</p>
                  <p className="text-sm font-black">{formatINR(item.unitPrice * item.qty)}</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => changeQty(item.id, item.qty - 1)} className="h-8 w-8 rounded-lg border">-</button>
                  <span className="text-sm font-bold min-w-8 text-center">{item.qty}</span>
                  <button type="button" onClick={() => changeQty(item.id, item.qty + 1)} className="h-8 w-8 rounded-lg border">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 bg-zinc-50 dark:bg-zinc-950 w-full"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Customer phone (optional)"
              className="h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 bg-zinc-50 dark:bg-zinc-950 w-full"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 bg-zinc-50 dark:bg-zinc-950 w-full"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span>GST</span><span>{formatINR(totals.gstAmount)}</span></div>
            <div className="flex justify-between font-black text-base mt-1"><span>Total</span><span>{formatINR(totals.grandTotal)}</span></div>
          </div>

          {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="mt-2 text-sm text-emerald-600">{success}</p> : null}

          <button
            type="button"
            onClick={checkout}
            disabled={submitting || cart.length === 0}
            className="mt-3 h-11 rounded-xl bg-zinc-950 text-white font-black disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Complete Sale"}
          </button>
        </section>
      </div>
    </div>
  )
}
