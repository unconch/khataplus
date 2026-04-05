"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { InventoryItem } from "@/lib/types"

type Product = {
  id: string
  name: string
  price: number
  category: string
  badge: string
  gstRate: number
}

type CartItem = Product & { qty: number }

type SalesFormProps = {
  inventory: InventoryItem[]
  userId: string
  gstInclusive: boolean
  gstEnabled: boolean
  showBuyPrice?: boolean
  orgId: string
  org?: { name: string; gstin?: string; upi_id?: string; plan_type?: string }
}

const paymentMethods = ["Cash", "Card", "QR Pay", "Split"]

const THEMES = {
  dark: {
    bg: "#090d18",
    bgPanel: "#0e1320",
    bgCard: "#171d2d",
    bgInput: "#171d2d",
    bgCardDeep: "#0f1422",
    border: "#21293f",
    borderCard: "#2a344f",
    text: "#f0f0f0",
    textMuted: "#7f8aa5",
    textSub: "#8e99b2",
    emptyText: "#4d5770",
    accent: "#ff6b35",
    accentBg: "rgba(255,107,53,0.12)",
  },
  light: {
    bg: "#f4f5f7",
    bgPanel: "#ffffff",
    bgCard: "#ffffff",
    bgInput: "#f0f1f5",
    bgCardDeep: "#eef0f5",
    border: "#e0e3ec",
    borderCard: "#e0e3ec",
    text: "#1a1d27",
    textMuted: "#999",
    textSub: "#777",
    emptyText: "#ccc",
    accent: "#ff6b35",
    accentBg: "rgba(255,107,53,0.08)",
  },
}

export function SalesFormPos(props: SalesFormProps) {
  const barcodeRef = useRef<HTMLInputElement | null>(null)
  const barcodeBufferRef = useRef("")
  const lastBarcodeKeyTimeRef = useRef(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [selectedPayment, setSelectedPayment] = useState("Card")
  const [splitCash, setSplitCash] = useState("")
  const [splitCard, setSplitCard] = useState("")
  const [splitQr, setSplitQr] = useState("")
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [isDark, setIsDark] = useState(true)
  const [customerName, setCustomerName] = useState("")
  const [contactNo, setContactNo] = useState("")
  const [gstin, setGstin] = useState("")
  const [barcode, setBarcode] = useState("")
  const [isCompact, setIsCompact] = useState(false)

  const t = isDark ? THEMES.dark : THEMES.light
  const formatINR = (value: number) =>
    `\u20B9${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const badgeFromCategory = (category: string, name: string) => {
    const value = category.toLowerCase()
    if (value.includes("drink") || value.includes("beverage")) return "DR"
    if (value.includes("food") || value.includes("snack")) return "FD"
    if (value.includes("service")) return "SV"
    if (value.includes("electronic")) return "EL"
    if (value.includes("retail")) return "RT"
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return "PR"
  }

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 1220)
    onResize()
    window.addEventListener("resize", onResize, { passive: true })
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const products = useMemo<Product[]>(() => {
    return props.inventory.map((item) => {
      const rawCategory = item.category?.trim() || ""
      const category = rawCategory.length > 0 ? rawCategory : "General"
      const price = Number(item.sell_price || item.buy_price || 0)
      return {
        id: item.id,
        name: item.name,
        price,
        category,
        badge: badgeFromCategory(category, item.name),
        gstRate: Math.max(0, Number(item.gst_percentage || 0)) / 100,
      }
    })
  }, [props.inventory])

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map((p) => p.category))).sort((a, b) => a.localeCompare(b))]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, activeCategory, search])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const toProduct = (item: InventoryItem): Product => {
    const rawCategory = item.category?.trim() || ""
    const category = rawCategory.length > 0 ? rawCategory : "General"
    return {
      id: item.id,
      name: item.name,
      price: Number(item.sell_price || item.buy_price || 0),
      category,
      badge: badgeFromCategory(category, item.name || "PR"),
      gstRate: Math.max(0, Number(item.gst_percentage || 0)) / 100,
    }
  }

  const scanBarcodeCode = (codeInput: string) => {
    const code = codeInput.trim().toLowerCase()
    if (!code) return
    const match = props.inventory.find((item) => String(item.sku || "").toLowerCase() === code)
    if (!match) return
    const product = toProduct(match)
    addToCart(product)
    setBarcode("")
  }

  const handleBarcodeScan = () => {
    scanBarcodeCode(barcode)
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    )
  }

  const grossBase = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const discountMultiplier = 1 - discount / 100
  const discountAmt = grossBase - grossBase * discountMultiplier
  const totals = cart.reduce(
    (acc, i) => {
      const lineBase = i.price * i.qty * discountMultiplier
      if (!props.gstEnabled) {
        acc.subtotal += lineBase
        acc.total += lineBase
        return acc
      }

      const rate = i.gstRate
      if (props.gstInclusive) {
        const lineSubtotal = lineBase / (1 + rate)
        const lineTax = lineBase - lineSubtotal
        acc.subtotal += lineSubtotal
        acc.tax += lineTax
        acc.total += lineBase
        return acc
      }

      const lineSubtotal = lineBase
      const lineTax = lineSubtotal * rate
      acc.subtotal += lineSubtotal
      acc.tax += lineTax
      acc.total += lineSubtotal + lineTax
      return acc
    },
    { subtotal: 0, tax: 0, total: 0 }
  )
  const subtotal = totals.subtotal
  const tax = totals.tax
  const total = totals.total
  const effectiveGstPct = subtotal > 0 ? (tax / subtotal) * 100 : 0
  const splitCashNum = Number.parseFloat(splitCash || "0") || 0
  const splitCardNum = Number.parseFloat(splitCard || "0") || 0
  const splitQrNum = Number.parseFloat(splitQr || "0") || 0
  const splitEntered = splitCashNum + splitCardNum + splitQrNum
  const splitRemaining = total - splitEntered

  const handleCheckout = () => {
    if (cart.length === 0) return
    setOrderPlaced(true)
    window.setTimeout(() => {
      setCart([])
      setOrderPlaced(false)
      setDiscount(0)
      setSplitCash("")
      setSplitCard("")
      setSplitQr("")
    }, 2200)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName || ""
      const isTyping = tag === "INPUT" || tag === "TEXTAREA"
      const nowTs = Date.now()
      const delta = nowTs - lastBarcodeKeyTimeRef.current

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
        if (delta < 45) {
          barcodeBufferRef.current += event.key
        } else {
          barcodeBufferRef.current = event.key
        }
        lastBarcodeKeyTimeRef.current = nowTs
      }

      if (event.key === "Enter" && barcodeBufferRef.current.length >= 3) {
        const code = barcodeBufferRef.current
        barcodeBufferRef.current = ""
        lastBarcodeKeyTimeRef.current = 0
        scanBarcodeCode(code)
        if (!isTyping) event.preventDefault()
        return
      }

      if (event.key === "/" && !isTyping) {
        event.preventDefault()
        barcodeRef.current?.focus()
        barcodeRef.current?.select()
        return
      }

      if (event.key.toLowerCase() === "d" && !isTyping) {
        event.preventDefault()
        setIsDark((prev) => !prev)
        return
      }

      if (event.key === "F1" && !isTyping) {
        event.preventDefault()
        setSelectedPayment("Cash")
        return
      }

      if (event.key === "F2" && !isTyping) {
        event.preventDefault()
        setSelectedPayment("Card")
        return
      }

      if (event.key === "F3" && !isTyping) {
        event.preventDefault()
        setSelectedPayment("QR Pay")
        return
      }

      if (event.key === "F4" && !isTyping) {
        event.preventDefault()
        setSelectedPayment("Split")
        return
      }

      if (event.key === "ArrowRight" && !isTyping) {
        event.preventDefault()
        const idx = categories.findIndex((c) => c === activeCategory)
        const next = categories[(idx + 1) % categories.length]
        setActiveCategory(next)
        return
      }

      if (event.key === "ArrowLeft" && !isTyping) {
        event.preventDefault()
        const idx = categories.findIndex((c) => c === activeCategory)
        const next = categories[(idx - 1 + categories.length) % categories.length]
        setActiveCategory(next)
        return
      }

      if ((event.key === "+" || event.key === "=") && !isTyping && cart.length > 0) {
        event.preventDefault()
        const last = cart[cart.length - 1]
        updateQty(last.id, 1)
        return
      }

      if ((event.key === "-" || event.key === "_") && !isTyping && cart.length > 0) {
        event.preventDefault()
        const last = cart[cart.length - 1]
        updateQty(last.id, -1)
        return
      }

      if ((event.key === "Delete" || event.key === "Backspace") && !isTyping && cart.length > 0) {
        event.preventDefault()
        setCart((prev) => prev.slice(0, -1))
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "backspace") {
        event.preventDefault()
        setCart([])
        return
      }

      if (event.key === "Enter" && !isTyping && cart.length > 0) {
        event.preventDefault()
        handleCheckout()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeCategory, cart, categories])

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isCompact ? "1fr" : "minmax(0,1fr) minmax(340px,36vw)",
        gridTemplateRows: isCompact ? "minmax(0,1fr) minmax(260px,42dvh)" : "1fr",
        width: "100vw",
        height: "100dvh",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: t.bg,
        color: t.text,
        overflow: "hidden",
      }}
    >
      <section style={{ minHeight: 0, display: "flex", flexDirection: "column", borderRight: isCompact ? "none" : `1px solid ${t.border}` }}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${t.border}`, background: t.bgPanel, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1fr 1fr 1.2fr", gap: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, letterSpacing: 0.4 }}>CUSTOMER NAME</span>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Rahul Sharma" style={{ background: t.bgInput, border: `1px solid ${t.borderCard}`, borderRadius: 10, padding: "11px 12px", color: t.text, outline: "none" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, letterSpacing: 0.4 }}>CONTACT NO.</span>
            <input value={contactNo} onChange={(e) => setContactNo(e.target.value)} placeholder="+91 10 digits" style={{ background: t.bgInput, border: `1px solid ${t.borderCard}`, borderRadius: 10, padding: "11px 12px", color: t.text, outline: "none" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, letterSpacing: 0.4 }}>GSTIN</span>
            <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" style={{ background: t.bgInput, border: `1px solid ${t.borderCard}`, borderRadius: 10, padding: "11px 12px", color: t.text, outline: "none" }} />
          </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "12px 24px", borderBottom: `1px solid ${t.border}`, overflowX: "auto", alignItems: "center" }}>
          <input
            ref={barcodeRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleBarcodeScan()
              }
            }}
            placeholder="Scan barcode..."
            style={{
              minWidth: isCompact ? 150 : 190,
              background: t.bgInput,
              border: `1px solid ${t.borderCard}`,
              borderRadius: 999,
              padding: "8px 14px",
              color: t.text,
              fontSize: 12,
              outline: "none",
            }}
          />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 25/2,
                fontWeight: 700,
                whiteSpace: "nowrap",
                background: activeCategory === cat ? t.accent : t.bgCard,
                color: activeCategory === cat ? "#fff" : t.textSub,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, alignContent: "start" }}>
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              style={{ background: t.bgCard, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: "18px 16px", cursor: "pointer", textAlign: "left", color: t.text, display: "grid", gap: 8 }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: "#d6ddf3" }}>{p.badge}</div>
              <div style={{ fontSize: 30/2, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontSize: 16, color: t.accent, fontWeight: 800 }}>{formatINR(p.price)}</div>
              <div style={{ fontSize: 12, color: t.textMuted, background: t.bgCardDeep, padding: "3px 10px", borderRadius: 8, width: "fit-content" }}>{p.category}</div>
            </button>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: t.emptyText, padding: 40 }}>No items found</div>}
        </div>
      </section>

      <aside style={{ minHeight: 0, display: "flex", flexDirection: "column", background: t.bgPanel, borderTop: isCompact ? `1px solid ${t.border}` : "none" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 34 / 2, fontWeight: 800 }}>Order Summary</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PosClock textSub={t.textSub} textMuted={t.textMuted} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: t.textSub }}>Dark</span>
              <button
                onClick={() => setIsDark((v) => !v)}
                style={{ width: 56, height: 32, borderRadius: 20, border: `1px solid ${t.borderCard}`, background: t.bgCard, cursor: "pointer", position: "relative" }}
              >
                <span style={{ position: "absolute", top: 4, left: isDark ? 4 : 28, width: 22, height: 22, borderRadius: "50%", background: t.accent, transition: "left 0.2s" }} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 22px" }}>
          {cart.length === 0 ? (
            <div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", color: t.emptyText }}>
              <div>
                <div style={{ fontSize: 54, lineHeight: 1 }}>C</div>
                <div style={{ marginTop: 14, fontSize: 30/2 }}>Tap items to add to order</div>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                <div>
                  <div style={{ fontSize: 28/2, fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: t.accent }}>{formatINR(item.price * item.qty)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.borderCard}`, background: t.bgCard, color: t.text, cursor: "pointer" }}>-</button>
                  <span style={{ minWidth: 18, textAlign: "center", fontSize: 13 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: t.accent, color: "#fff", cursor: "pointer" }}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "16px 22px 22px", borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: t.textMuted }}><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: t.textMuted }}><span>GST ({props.gstEnabled ? `${effectiveGstPct.toFixed(0)}%` : "0%"})</span><span>{formatINR(tax)}</span></div>
            {discountAmt > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#4ade80" }}><span>Discount</span><span>-{formatINR(discountAmt)}</span></div>}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 36/2, margin: "8px 0 14px" }}>
            <span>Total</span>
            <span style={{ color: t.accent }}>{formatINR(total)}</span>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {paymentMethods.map((pm) => (
              <button key={pm} onClick={() => setSelectedPayment(pm)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid", borderColor: selectedPayment === pm ? t.accent : t.borderCard, background: selectedPayment === pm ? t.accentBg : t.bgCard, color: selectedPayment === pm ? t.accent : t.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{pm}</button>
            ))}
          </div>

          {selectedPayment === "Split" && (
            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <input
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  placeholder="Cash"
                  inputMode="decimal"
                  style={{ background: t.bgInput, border: `1px solid ${t.borderCard}`, borderRadius: 8, padding: "8px 10px", color: t.text, fontSize: 12, outline: "none" }}
                />
                <input
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                  placeholder="Card"
                  inputMode="decimal"
                  style={{ background: t.bgInput, border: `1px solid ${t.borderCard}`, borderRadius: 8, padding: "8px 10px", color: t.text, fontSize: 12, outline: "none" }}
                />
                <input
                  value={splitQr}
                  onChange={(e) => setSplitQr(e.target.value)}
                  placeholder="QR Pay"
                  inputMode="decimal"
                  style={{ background: t.bgInput, border: `1px solid ${t.borderCard}`, borderRadius: 8, padding: "8px 10px", color: t.text, fontSize: 12, outline: "none" }}
                />
              </div>
              <div style={{ fontSize: 12, color: Math.abs(splitRemaining) < 0.01 ? "#4ade80" : t.textMuted }}>
                {Math.abs(splitRemaining) < 0.01
                  ? "Split matches total"
                  : splitRemaining > 0
                    ? `Remaining: ${formatINR(splitRemaining)}`
                    : `Excess: ${formatINR(Math.abs(splitRemaining))}`}
              </div>
            </div>
          )}

          <button
            onClick={handleCheckout}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 14,
              border: "none",
              background: orderPlaced ? "#4ade80" : cart.length === 0 ? t.bgCard : t.accent,
              color: cart.length === 0 ? t.textMuted : "#fff",
              fontSize: 35/2,
              fontWeight: 800,
              cursor: cart.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {orderPlaced ? "Order Complete" : `Charge ${formatINR(total)}`}
          </button>

          <div style={{ marginTop: 10, fontSize: 11, color: t.textMuted, display: "grid", gap: 3 }}>
            <span>`/` barcode | `←/→` categories | `+/-` qty</span>
            <span>`F1..F4` payment | `Enter` charge | `D` theme</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

function PosClock({ textSub, textMuted }: { textSub: string; textMuted: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: textSub }}>
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div style={{ fontSize: 12, color: textMuted }}>
        {now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
      </div>
    </div>
  )
}

