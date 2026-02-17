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
} from "lucide-react"
import { recordBatchSales } from "@/lib/data/sales"
import { cn } from "@/lib/utils"
import { type GroupedSale } from "@/lib/invoice-utils"
import { StateCard } from "@/components/ui/state-card"
import { PriceDisplay } from "@/components/ui/price-display"
import { SignatureReceipt } from "@/components/ui/signature-receipt"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSync } from "@/hooks/use-sync"
import { useHaptic } from "@/hooks/use-haptic"

interface SalesFormProps {
  inventory: InventoryItem[]
  userId: string
  gstInclusive: boolean
  gstEnabled: boolean
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

export function SalesForm({ inventory, userId, gstInclusive, gstEnabled, orgId, org }: SalesFormProps) {
  type SaleStep = 1 | 2 | 3 | 4
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<SaleStep>(1)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [quantity, setQuantity] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Credit">("Cash")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerGst, setCustomerGst] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastSaleGroup, setLastSaleGroup] = useState<GroupedSale | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const filteredItems =
    searchQuery.length >= 1
      ? inventory
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
    setSalePrice(item.buy_price.toString())
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

  const isOnline = useOnlineStatus()
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
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)
  const canContinue = cart.length > 0

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

    try {
      const salesPayload = cart.map((item) => ({
        inventory_id: item.inventoryItem.id,
        quantity: item.quantity,
        sale_price: item.salePrice,
        total_amount: item.totalAmount,
        gst_amount: item.gstAmount,
        profit: item.profit,
        payment_method: paymentMethod,
        customer_gstin: customerGst || undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
      }))

      if (!isOnline) {
        await addToQueue({
          url: "/api/sales",
          method: "POST",
          body: { sales: salesPayload, orgId },
        })

        setLastSaleGroup({
          id: `TEMP-${Date.now()}`,
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
        const results = await recordBatchSales(salesPayload, orgId)
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
    } catch {
      setError("Unable to record sale. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (inventory.length === 0) {
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

    return (
      <SignatureReceipt
        amount={totalAmount}
        customerName={customerName || "Walk-in Customer"}
        customerPhone={customerPhone}
        shopName={org?.name || "My Shop"}
        upiId={org?.upi_id}
        paymentMethod={paymentMethod}
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
    <div className="w-full h-full max-h-full overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="sticky top-0 z-20 px-4 md:px-7 pt-3 md:pt-4 pb-3 bg-zinc-50/95 dark:bg-zinc-950/95 border-b border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
          <div className="pr-12 md:pr-14 flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible">
            {[1, 2, 3, 4].map((s) => {
              const stepNo = s as SaleStep
              const locked = stepNo > 1 && !canContinue
              return (
                <button
                  key={stepNo}
                  type="button"
                  disabled={locked}
                  onClick={() => setStep(stepNo)}
                  className={cn(
                    "h-10 min-w-[128px] md:min-w-0 px-3 rounded-lg border text-sm font-semibold whitespace-nowrap flex items-center justify-center transition-colors",
                    step === stepNo
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200",
                    locked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {stepNo === 1 && "1. Items"}
                  {stepNo === 2 && "2. Customer"}
                  {stepNo === 3 && "3. Payment"}
                  {stepNo === 4 && "4. Review"}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 md:px-7 pt-4 md:pt-6 pb-4 md:pb-7 space-y-5">
          {step === 1 && (
            <div className="space-y-5">
              <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="h-12 px-4 flex items-center gap-2">
                  <SearchIcon className="h-4 w-4 text-zinc-500" />
                  <input
                    id="item"
                    autoComplete="off"
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="Search product or SKU"
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
                          <p className="text-sm font-semibold">Rs{item.buy_price}</p>
                          <p className="text-[11px] text-muted-foreground">Stock {item.stock}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/20 p-3 md:p-4">
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
                      Price {gstEnabled ? (gstInclusive ? "(incl GST)" : "(excl GST)") : ""}
                    </Label>
                    <input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      className="w-full bg-transparent outline-none text-lg font-semibold mt-1"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Button
                      type="button"
                      className="w-full h-full min-h-14 rounded-xl font-semibold"
                      disabled={!selectedItem || !quantity || !salePrice}
                      onClick={addToCart}
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add
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
                <Button type="button" onClick={() => setStep(2)} disabled={!canContinue} className="rounded-xl">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Customer Details (optional)</Label>
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
                <Button type="button" onClick={() => setStep(3)} className="rounded-xl">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 rounded-xl border text-xs font-semibold",
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
                      "h-11 rounded-xl border text-xs font-semibold",
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
                      "h-11 rounded-xl border text-xs font-semibold",
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

              <div className="sticky bottom-0 pt-3 flex items-center justify-between bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(4)} className="rounded-xl">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/30 p-4 space-y-2.5">
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">Rs{subtotalAmount.toFixed(2)}</span>
                </div>
                {gstEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST</span>
                    <span className="font-medium">Rs{grandTotals.gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit</span>
                  <span className={cn("font-medium", grandTotals.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    Rs{grandTotals.profit.toFixed(2)}
                  </span>
                </div>
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
                <Button type="submit" className="h-12 rounded-xl font-semibold text-base" disabled={isLoading || cart.length === 0}>
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
