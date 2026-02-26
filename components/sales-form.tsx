"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { InventoryItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  BoxIcon,
  SearchIcon,
  Loader2,
  CreditCardIcon,
  BanknoteIcon,
  PlusIcon,
  Trash2Icon,
  ShoppingCartIcon,
  ArrowRight,
  UserIcon,
  Wallet2Icon,
  ClipboardCheckIcon,
} from "lucide-react"
import { recordBatchSales } from "@/lib/data/sales"
import { cn } from "@/lib/utils"
import { type GroupedSale } from "@/lib/invoice-utils"
import { StateCard } from "@/components/ui/state-card"
import { PriceDisplay } from "@/components/ui/price-display"
import { SignatureReceipt } from "@/components/ui/signature-receipt"
import { useInventoryCache } from "@/hooks/use-inventory-cache"
import { useSync } from "@/hooks/use-sync"
import { useHaptic } from "@/hooks/use-haptic"

interface SalesFormProps {
  inventory: InventoryItem[]
  userId: string
  gstInclusive: boolean
  gstEnabled: boolean
  showBuyPrice?: boolean
  orgId: string
  org?: { name: string; gstin?: string; upi_id?: string }
}

interface CartItem {
  inventoryItem: InventoryItem
  quantity: number
  salePrice: number
  baseAmount: number
  gstAmount: number
  totalAmount: number
  profit: number
}

export function SalesForm({ inventory, userId, gstInclusive, gstEnabled, showBuyPrice = false, orgId, org }: SalesFormProps) {
  type SaleStep = 1 | 2 | 3 | 4
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<SaleStep>(1)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [quantity, setQuantity] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Credit">("Cash")
  const [requireUpiVerification, setRequireUpiVerification] = useState(true)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerGst, setCustomerGst] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastSaleGroup, setLastSaleGroup] = useState<GroupedSale | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { inventory: inventorySource, isOnline, applyLocalSale } = useInventoryCache(inventory, orgId)

  const filteredItems =
    searchQuery.length >= 1
      ? inventorySource
          .filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.sku.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 8)
      : []

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setSearchQuery(item.name)
    const hasValidSellPrice = Number(item.sell_price) > 0
    setSalePrice(hasValidSellPrice ? String(item.sell_price) : "")
    setQuantity("1")
    setShowSuggestions(false)
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setShowSuggestions(true)
    if (selectedItem && val !== selectedItem.name) {
      setSelectedItem(null)
    }
  }

  const calculateItemTotals = (item: InventoryItem, qty: number, price: number) => {
    if (!gstEnabled) {
      const totalAmount = qty * price
      const profit = (price - item.buy_price) * qty
      return { baseAmount: totalAmount, gstAmount: 0, totalAmount, profit }
    }

    const gstRate = item.gst_percentage / 100
    if (gstInclusive) {
      const totalAmount = qty * price
      const baseAmount = totalAmount / (1 + gstRate)
      const gstAmount = totalAmount - baseAmount
      const profit = (price / (1 + gstRate) - item.buy_price) * qty
      return { baseAmount, gstAmount, totalAmount, profit }
    }

    const baseAmount = qty * price
    const gstAmount = baseAmount * gstRate
    const totalAmount = baseAmount + gstAmount
    const profit = (price - item.buy_price) * qty
    return { baseAmount, gstAmount, totalAmount, profit }
  }

  const { addToQueue } = useSync()
  const { trigger: haptic } = useHaptic()

  const addToCart = () => {
    if (!selectedItem || !quantity || !salePrice) return

    const qty = Number.parseInt(quantity)
    const price = Number.parseFloat(salePrice)

    if (qty > selectedItem.stock) {
      setError(`Only ${selectedItem.stock} units available in stock`)
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid selling price greater than 0")
      return
    }

    const { baseAmount, gstAmount, totalAmount, profit } = calculateItemTotals(selectedItem, qty, price)

    setCart((prev) => [
      ...prev,
      {
        inventoryItem: selectedItem,
        quantity: qty,
        salePrice: price,
        baseAmount,
        gstAmount,
        totalAmount,
        profit,
      },
    ])

    setSearchQuery("")
    setQuantity("")
    setSalePrice("")
    setSelectedItem(null)
    setError(null)
    haptic("light")
  }

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) setStep(1)
      return next
    })
    haptic("warning")
  }

  const grandTotals = cart.reduce(
    (acc, item) => ({
      totalAmount: acc.totalAmount + item.totalAmount,
      gstAmount: acc.gstAmount + item.gstAmount,
      profit: acc.profit + item.profit,
    }),
    { totalAmount: 0, gstAmount: 0, profit: 0 }
  )

  const subtotalAmount = grandTotals.totalAmount - grandTotals.gstAmount
  const cgstAmount = grandTotals.gstAmount / 2
  const sgstAmount = grandTotals.gstAmount / 2
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)
  const canContinue = cart.length > 0
  const stepMeta: Array<{ id: SaleStep; label: string; icon: React.ComponentType<any> }> = [
    { id: 1, label: "Items", icon: ShoppingCartIcon },
    { id: 2, label: "Customer", icon: UserIcon },
    { id: 3, label: "Payment", icon: Wallet2Icon },
    { id: 4, label: "Review", icon: ClipboardCheckIcon },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    setIsLoading(true)
    setError(null)

    if (!userId) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }
    if (cart.some((item) => !Number.isFinite(item.salePrice) || Number(item.salePrice) <= 0)) {
      setError("One or more items have invalid sales price. Set price above 0.")
      setIsLoading(false)
      return
    }

    try {
      const submissionKey = `sale_${Date.now()}_${crypto.randomUUID()}`
      const salesPayload = cart.map((item) => {
        const paymentStatus: "pending" | "paid" =
          paymentMethod === "Credit"
            ? "pending"
            : paymentMethod === "UPI" && requireUpiVerification
              ? "pending"
              : "paid"

        return {
          inventory_id: item.inventoryItem.id,
          quantity: item.quantity,
          sale_price: item.salePrice,
          total_amount: item.totalAmount,
          gst_amount: item.gstAmount,
          profit: item.profit,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          customer_gstin: customerGst || undefined,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
        }
      })

      if (!isOnline) {
        await addToQueue({
          url: "/api/sales",
          method: "POST",
          body: { sales: salesPayload, orgId, idempotencyKey: submissionKey },
        })
        await applyLocalSale(
          salesPayload.map((sale) => ({
            inventory_id: sale.inventory_id,
            quantity: sale.quantity,
          }))
        )

        setLastSaleGroup({
          id: submissionKey,
          userId,
          createdat: new Date().toISOString(),
          saledate: new Date().toISOString(),
          paymentMethod,
          items: salesPayload.map((s, idx) => ({
            id: `TEMP-ITEM-${idx}`,
            ...s,
            created_at: new Date().toISOString(),
            inventory: cart[idx].inventoryItem,
          })) as any,
        })
        setSuccess(true)
        haptic("success")
      } else {
        const results = await recordBatchSales(salesPayload, orgId, submissionKey)
        if (results && results.length > 0) {
          setLastSaleGroup({
            id: results[0].batch_id || results[0].id,
            userId: results[0].user_id,
            createdat: results[0].created_at,
            saledate: results[0].sale_date,
            paymentMethod: results[0].payment_method,
            items: results.map((r, idx) => ({
              ...r,
              inventory: cart[idx].inventoryItem,
            })),
          })
          setSuccess(true)
        }
      }

      setCart([])
    } catch (err: any) {
      const rawMessage =
        err?.message ||
        err?.toString?.() ||
        "Unable to record sale. Please try again."
      const cleanMessage = String(rawMessage)
        .replace(/^Error:\s*/i, "")
        .replace(/^Batch Transaction Failed:\s*/i, "")
        .trim()

      if (/insufficient stock/i.test(cleanMessage)) {
        setError("Stock changed while billing. Reduce quantity and retry.")
      } else if (/invalid sales data/i.test(cleanMessage)) {
        setError("Invalid sale details. Check quantity, price, and customer fields.")
      } else if (/unauthorized|forbidden/i.test(cleanMessage)) {
        setError("Permission denied. Please re-login and try again.")
      } else {
        setError(cleanMessage || "Unable to record sale. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (inventorySource.length === 0) {
    return (
      <Card className="border-dashed bg-zinc-50 dark:bg-zinc-900/40">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <BoxIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-xl font-bold text-muted-foreground">No Inventory Available</p>
          <p className="text-sm text-muted-foreground/70 max-w-[240px] mx-auto mt-2">
            Add products first, then create a sale.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (success && lastSaleGroup) {
    const totalAmount = lastSaleGroup.items.reduce((sum, item) => sum + item.total_amount, 0)
    const paymentStatus = (lastSaleGroup.items?.[0] as any)?.payment_status || "paid"

    return (
      <SignatureReceipt
        amount={totalAmount}
        customerName={customerName || "Walk-in Customer"}
        customerPhone={customerPhone}
        shopName={org?.name || "My Shop"}
        upiId={org?.upi_id}
        paymentMethod={paymentMethod}
        paymentStatus={paymentStatus}
        itemCount={lastSaleGroup.items.length}
        onClose={() => setSuccess(false)}
        onNewSale={() => {
          setSuccess(false)
          setLastSaleGroup(null)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="w-full">
      <div>
        <div className="sticky top-0 z-20 px-4 md:px-7 pt-2 md:pt-2.5 pb-2 bg-zinc-50/95 dark:bg-zinc-950/95 border-b border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/75">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-800/70">
            {stepMeta.map(({ id: stepNo, label, icon: Icon }) => {
              const locked = stepNo > 1 && !canContinue
              return (
                <button
                  key={stepNo}
                  type="button"
                  disabled={locked}
                  onClick={() => setStep(stepNo)}
                  className={cn(
                    "h-10 px-3 text-[11px] font-bold uppercase tracking-[0.08em] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all bg-slate-50 dark:bg-slate-900",
                    step === stepNo
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                      : "text-slate-600 dark:text-slate-300",
                    locked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {stepNo}. {label}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 md:px-7 pt-4 md:pt-6 pb-4 md:pb-7 space-y-5">
          {step === 1 && (
            <div className="space-y-5">
              <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                <div className="h-12 px-4 flex items-center gap-2">
                  <SearchIcon className="h-4 w-4 text-zinc-500" />
                  <input
                    id="item"
                    autoComplete="off"
                    className="w-full bg-transparent outline-none text-sm font-medium"
                    placeholder="Search by product name or SKU"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>
                {showSuggestions && filteredItems.length > 0 && (
                  <div className="absolute z-[120] left-2 right-2 top-full mt-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden max-h-[min(36dvh,320px)] overflow-y-auto">
                    {filteredItems.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="w-full px-4 py-3.5 text-left border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between gap-3"
                        onClick={() => handleSelectItem(item)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {(Number(item.sell_price) > 0) ? (
                            <p className="text-sm font-semibold">Rs{item.sell_price}</p>
                          ) : showBuyPrice ? (
                            <p className="text-sm font-semibold">Rs{item.buy_price}</p>
                          ) : null}
                          <p className="text-[11px] text-muted-foreground">Stock {item.stock}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/30 dark:to-zinc-950 p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5">
                    <Label htmlFor="quantity" className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Qty
                    </Label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      className="w-full bg-transparent outline-none text-lg font-semibold mt-1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="md:col-span-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5">
                    <Label htmlFor="salePrice" className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Sales Price {gstEnabled ? (gstInclusive ? "(incl GST)" : "(excl GST)") : ""}
                    </Label>
                    <input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      className="w-full bg-transparent outline-none text-lg font-semibold mt-1"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder={selectedItem && !(Number(selectedItem.sell_price) > 0) ? "Enter selling price" : "0"}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Button
                      type="button"
                      className="w-full h-full min-h-14 rounded-xl font-black uppercase tracking-wide bg-emerald-600 hover:bg-emerald-500"
                      disabled={!selectedItem || !quantity || !salePrice}
                      onClick={addToCart}
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/60 grid grid-cols-12 items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-3 text-right">Amount</span>
                  <span className="col-span-1 text-right"> </span>
                </div>
                <div className="max-h-[min(38dvh,320px)] md:max-h-[min(40dvh,360px)] overflow-y-auto">
                  {cart.length === 0 && (
                    <div className="p-6">
                      <StateCard
                        title="Cart is empty"
                        description="Search and add at least one product to continue checkout."
                        variant="empty"
                        className="border-none bg-transparent py-10"
                      />
                    </div>
                  )}
                  {cart.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 grid grid-cols-12 items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="col-span-6 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.inventoryItem.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Rs{item.salePrice} each</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center px-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        <PriceDisplay amount={item.totalAmount} size="sm" />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 inline-flex items-center justify-center"
                          onClick={() => removeFromCart(idx)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 pt-3 flex justify-end bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button type="button" onClick={() => setStep(2)} disabled={!canContinue} className="rounded-xl font-black uppercase tracking-wide">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900/30 dark:to-zinc-950">
                <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Customer Details (optional)</Label>
                <input
                  className="h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    className="h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <input
                    className="h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 text-sm"
                    placeholder="GSTIN"
                    value={customerGst}
                    onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 pt-3 flex items-center justify-between bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)} className="rounded-xl font-black uppercase tracking-wide">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Payment Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 rounded-xl border text-xs font-black uppercase tracking-wide",
                      paymentMethod === "Cash"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white hover:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-700"
                    )}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    <BanknoteIcon className="h-4 w-4 mr-1.5" />
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 rounded-xl border text-xs font-black uppercase tracking-wide",
                      paymentMethod === "UPI"
                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    )}
                    onClick={() => setPaymentMethod("UPI")}
                  >
                    <CreditCardIcon className="h-4 w-4 mr-1.5" />
                    UPI
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 rounded-xl border text-xs font-black uppercase tracking-wide",
                      paymentMethod === "Credit"
                        ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-400"
                        : "border-zinc-200 dark:border-zinc-700"
                    )}
                    onClick={() => setPaymentMethod("Credit")}
                  >
                    <ShoppingCartIcon className="h-4 w-4 mr-1.5" />
                    Credit
                  </Button>
                </div>
              </div>

              {paymentMethod === "UPI" && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Own QR mode: keep payment pending until you manually confirm received amount.
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 rounded-xl text-xs font-black uppercase tracking-wide",
                        requireUpiVerification
                          ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500"
                          : "border-zinc-200 dark:border-zinc-700"
                      )}
                      onClick={() => setRequireUpiVerification((v) => !v)}
                    >
                      {requireUpiVerification ? "Manual Confirmation: ON" : "Manual Confirmation: OFF"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 pt-3 flex items-center justify-between bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(4)} className="rounded-xl font-black uppercase tracking-wide">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50/90 to-white dark:from-zinc-900/40 dark:to-zinc-950 p-4 space-y-2.5">
                <div className="space-y-2 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Line Items Review</p>
                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden bg-white/80 dark:bg-zinc-900/40">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-100/70 dark:bg-zinc-900/80">
                      <div className="col-span-6">Item</div>
                      <div className="col-span-2 text-right">Qty</div>
                      <div className="col-span-2 text-right">Rate</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {cart.map((item, idx) => (
                        <div key={`${item.inventoryItem.id}-${idx}`} className="grid grid-cols-12 gap-2 px-3 py-2.5 text-[12px]">
                          <div className="col-span-6 min-w-0">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.inventoryItem.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">GST {Number(item.inventoryItem.gst_percentage || 0).toFixed(0)}%</p>
                          </div>
                          <div className="col-span-2 text-right font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{item.quantity}</div>
                          <div className="col-span-2 text-right font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">Rs{item.salePrice.toFixed(2)}</div>
                          <div className="col-span-2 text-right font-black text-zinc-900 dark:text-zinc-100 tabular-nums">Rs{item.totalAmount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{cart.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Units</span>
                  <span className="font-medium">{totalUnits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                {(paymentMethod === "UPI" || paymentMethod === "Credit") && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <span className="font-medium">
                      {paymentMethod === "UPI" && requireUpiVerification ? "Pending (verify later)" : paymentMethod === "Credit" ? "Pending" : "Paid"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">Rs{subtotalAmount.toFixed(2)}</span>
                </div>
                {gstEnabled && (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-200 dark:divide-zinc-800">
                      <div className="px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Taxable</p>
                        <p className="text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">Rs{subtotalAmount.toFixed(2)}</p>
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">CGST</p>
                        <p className="text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">Rs{cgstAmount.toFixed(2)}</p>
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">SGST</p>
                        <p className="text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">Rs{sgstAmount.toFixed(2)}</p>
                      </div>
                      <div className="px-3 py-2.5 bg-emerald-50/70 dark:bg-emerald-500/10">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">GST Total</p>
                        <p className="text-[13px] font-black tabular-nums text-emerald-700 dark:text-emerald-300">Rs{grandTotals.gstAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-end justify-between">
                  <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold">Grand Total</span>
                  <PriceDisplay amount={grandTotals.totalAmount} size="2xl" className="text-foreground" />
                </div>
              </div>

              {error && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl text-center">
                  {error}
                </p>
              )}

              <div className="sticky bottom-0 pt-3 flex items-center justify-between bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button type="button" variant="outline" onClick={() => setStep(3)} className="rounded-xl">
                  Back
                </Button>
                <Button type="submit" className="h-12 rounded-xl font-black uppercase tracking-wide text-base bg-emerald-600 hover:bg-emerald-500" disabled={isLoading || cart.length === 0}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Complete Sale
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
