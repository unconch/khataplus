"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { InventoryItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircleIcon,
  BoxIcon,
  SearchIcon,
  Loader2,
  CreditCardIcon,
  BanknoteIcon,
  PlusIcon,
  Trash2Icon,
  ShoppingCartIcon,
  ArrowRight,
  Tag,
  Calculator,
  Target,
  Printer,
  Download,
  CheckCircle2
} from "lucide-react"
import { recordBatchSales } from "@/lib/data/sales"
import { cn } from "@/lib/utils"
import { generateInvoice, type GroupedSale } from "@/lib/invoice-utils"
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
  org?: { name: string; gstin?: string }
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
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [quantity, setQuantity] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI">("Cash")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerGst, setCustomerGst] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastSaleGroup, setLastSaleGroup] = useState<GroupedSale | null>(null)
  const [isPrinting, setIsPrinting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const filteredItems = searchQuery.length >= 1
    ? inventory.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8)
    : []

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setSearchQuery(item.name)
    setSalePrice(item.buy_price.toString()) // Pre-fill with buy price as a starting point
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
      const profit = ((price / (1 + gstRate)) - item.buy_price) * qty
      return { baseAmount, gstAmount, totalAmount, profit }
    } else {
      const baseAmount = qty * price
      const gstAmount = baseAmount * gstRate
      const totalAmount = baseAmount + gstAmount
      const profit = (price - item.buy_price) * qty
      return { baseAmount, gstAmount, totalAmount, profit }
    }
  }

  const addToCart = () => {
    if (!selectedItem || !quantity || !salePrice) {
      return
    }
    const qty = Number.parseInt(quantity)
    const price = Number.parseFloat(salePrice)

    if (qty > selectedItem.stock) {
      setError(`Only ${selectedItem.stock} units available in stock`)
      return
    }

    const { baseAmount, gstAmount, totalAmount, profit } = calculateItemTotals(selectedItem, qty, price)

    const newCartItem: CartItem = {
      inventoryItem: selectedItem,
      quantity: qty,
      salePrice: price,
      baseAmount,
      gstAmount,
      totalAmount,
      profit
    }

    setCart(prev => [...prev, newCartItem])

    // Reset inputs
    setSearchQuery("")
    setQuantity("")
    setSalePrice("")
    setSelectedItem(null)
    haptic("light")
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
    haptic("warning")
  }

  const grandTotals = cart.reduce((acc, item) => ({
    totalAmount: acc.totalAmount + item.totalAmount,
    gstAmount: acc.gstAmount + item.gstAmount,
    profit: acc.profit + item.profit
  }), { totalAmount: 0, gstAmount: 0, profit: 0 })

  const isOnline = useOnlineStatus()
  const { addToQueue } = useSync()
  const { trigger: haptic } = useHaptic()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      return
    }

    setIsLoading(true)
    setError(null)

    if (!userId) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }

    try {
      const salesPayload = cart.map(item => ({
        inventory_id: item.inventoryItem.id,
        quantity: item.quantity,
        sale_price: item.salePrice,
        total_amount: item.totalAmount,
        gst_amount: item.gstAmount,
        profit: item.profit,
        payment_method: paymentMethod,
        customer_gstin: customerGst || undefined
      }))

      if (!isOnline) {
        // Offline Mode: Queue it!
        await addToQueue({
          url: "/api/sales",
          method: "POST",
          body: { sales: salesPayload, orgId }
        })

        // Fake success state for UX
        setLastSaleGroup({
          id: `TEMP-${Date.now()}`,
          userId: userId,
          createdat: new Date().toISOString(),
          saledate: new Date().toISOString(),
          paymentMethod: paymentMethod,
          items: salesPayload.map((s, idx) => ({
            id: `TEMP-ITEM-${idx}`,
            ...s,
            created_at: new Date().toISOString(),
            inventory: cart[idx].inventoryItem
          })) as any
        })
        setSuccess(true)
        haptic("success")
      } else {
        // Online Mode: Direct Server Action
        const results = await recordBatchSales(salesPayload, orgId)

        if (results && results.length > 0) {
          // Construct GroupedSale for printing using cart data for inventory details
          setLastSaleGroup({
            id: results[0].batch_id || results[0].id,
            userId: results[0].user_id,
            createdat: results[0].created_at,
            saledate: results[0].sale_date,
            paymentMethod: results[0].payment_method,
            items: results.map((r, idx) => ({
              ...r,
              inventory: cart[idx].inventoryItem
            }))
          })
          setSuccess(true)
        }
      }
      setCart([])
    } catch (err) {
      setError("Unable to record sale. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Design Helpers
  // Minimalist: Removing uppercase tracking, using standard fonts, lighter borders
  const sectionTitleClasses = "text-sm font-bold text-foreground mb-2 flex items-center gap-2"
  const inputContainerClasses = "group relative flex flex-col gap-1 p-2 md:p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20"
  const labelClasses = "text-[10px] md:text-xs font-medium text-muted-foreground group-focus-within:text-foreground transition-colors"
  const inputClasses = "h-8 md:h-9 bg-transparent border-none text-sm md:text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted-foreground/40 font-sans"

  if (inventory.length === 0) {
    return (
      <Card className="border-dashed glass-card bg-zinc-50/50">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <BoxIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-xl font-black tracking-tight text-muted-foreground">Product Hub Empty</p>
          <p className="text-sm text-muted-foreground/50 max-w-[200px] mx-auto mt-2">Initialize inventory before recording sales.</p>
        </CardContent>
      </Card>
    )
  }

  if (success && lastSaleGroup) {
    const totalAmount = lastSaleGroup.items.reduce((sum, item) => sum + item.total_amount, 0)

    return (
      <SignatureReceipt
        amount={totalAmount}
        customerName="Walk-in Customer" // TODO: Wire up actual customer name
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start animate-slide-up pb-6 lg:pb-0">
      {/* Left Column: Item Selection */}
      <div className="lg:col-span-7 space-y-6">
        <section>
          <div className={sectionTitleClasses}>
            Search Products
          </div>
          <div className="space-y-4">
            <div className={cn(inputContainerClasses, "relative")}>
              <Label htmlFor="item" className={labelClasses}>Find SKU or Product</Label>
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-primary/30" />
                <input
                  id="item"
                  autoComplete="off"
                  className={cn(inputClasses, "w-full focus:outline-none")}
                  placeholder="Type name or SKU..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                />
              </div>

              {showSuggestions && filteredItems.length > 0 && (
                <div className="absolute z-[120] left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[300px] md:max-h-[400px] overflow-y-auto animate-in slide-in-from-top-2 duration-300">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 md:p-4 hover:bg-zinc-50 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 cursor-pointer transition-all border-b border-zinc-100 dark:border-white/5 last:border-0"
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 md:h-10 md:w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black">
                          {item.sku.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-sm md:text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground font-medium">{item.sku}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm md:text-xs font-black font-mono">₹{item.buy_price}</div>
                        <div className={cn(
                          "text-[9px] font-black uppercase tracking-tighter",
                          item.stock < 10 ? 'text-orange-500' : 'text-emerald-500'
                        )}>
                          {item.stock} Avail.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn(inputContainerClasses, "bg-zinc-100/50 cursor-not-allowed opacity-60")}>
                <Label className={labelClasses}>Registered Cost</Label>
                <div className="h-10 flex items-center text-xl font-black font-mono tracking-tighter">
                  {selectedItem ? `₹${selectedItem.buy_price}` : "—"}
                </div>
              </div>
              <div className={inputContainerClasses}>
                <Label htmlFor="quantity" className={labelClasses}>Units</Label>
                <input
                  id="quantity"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  className={cn(inputClasses, "w-full focus:outline-none")}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            <div className={cn(inputContainerClasses, "p-3 md:p-6")}>
              <Label htmlFor="salePrice" className={labelClasses}>
                Selling Value (Single Unit) {gstEnabled && (gstInclusive ? "[GST Incl.]" : "[GST Excl.]")}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-medium text-muted-foreground">₹</span>
                <input
                  id="salePrice"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="h-10 bg-transparent border-none text-2xl font-semibold focus:outline-none p-0 placeholder:text-muted-foreground/30 font-sans"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-black text-xs uppercase tracking-[0.2em] group"
              disabled={!selectedItem || !quantity || !salePrice}
              onClick={addToCart}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Stage Item
              <ArrowRight className="h-3 w-3 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Button>
          </div>
        </section>
      </div>

      {/* Right Column: Cart & Summary */}
      <div className="lg:col-span-5 space-y-4 lg:space-y-6">
        <Card className="glass-panel border-zinc-200/50 dark:border-white/10 text-foreground rounded-[2rem] md:rounded-[2.5rem] overflow-hidden sticky top-4 lg:top-0">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex-1">
                <h4 className="text-lg font-semibold tracking-tight">Current Sale</h4>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShoppingCartIcon className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto no-scrollbar">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 group animate-in slide-in-from-right-2 duration-300">
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm truncate">{item.inventoryItem.name}</div>
                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                      {item.quantity} units • ₹{item.salePrice}/ea
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <PriceDisplay amount={item.totalAmount} size="sm" />
                      {item.profit > 0 && (
                        <div className="text-[9px] text-emerald-400 font-black tracking-widest uppercase">
                          +₹{item.profit.toFixed(0)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                      onClick={() => removeFromCart(idx)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <StateCard
                  title="Terminal Idle"
                  description="Scan SKU or Select Item to begin"
                  variant="empty"
                  className="py-12 border-none bg-transparent"
                />
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Settlement Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-center gap-2 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95",
                      paymentMethod === "Cash"
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
                    )}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    <BanknoteIcon className="h-4 w-4" />
                    Physical Cash
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-center gap-2 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95",
                      paymentMethod === "UPI"
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white/60 border-white/10 hover:border-white/30"
                    )}
                    onClick={() => setPaymentMethod("UPI")}
                  >
                    <CreditCardIcon className="h-4 w-4" />
                    Digital Payment
                  </button>
                </div>
              </div>

              {/* B2B / Customer Details Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Customer Details (Optional)</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className={cn(inputClasses, "bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:bg-white/10 transition-all")}
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <input
                    className={cn(inputClasses, "bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:bg-white/10 transition-all")}
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <input
                    className={cn(inputClasses, "bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:bg-white/10 transition-all md:col-span-2")}
                    placeholder="GSTIN (For B2B Credit)"
                    value={customerGst}
                    onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                {gstEnabled && (
                  <div className="flex justify-between text-xs font-bold text-white/40">
                    <span className="uppercase tracking-widest">Tax Component</span>
                    <span className="font-mono">₹{grandTotals.gstAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Total Settlement</span>
                    <PriceDisplay amount={grandTotals.totalAmount} size="2xl" className="text-foreground" />
                  </div>
                </div>
              </div>

              {error && <p className="text-xs font-black text-rose-500 bg-rose-500/10 p-4 rounded-2xl text-center uppercase tracking-tight">{error}</p>}

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-black uppercase tracking-[0.15em] text-xs shadow-lg shadow-primary/20 active:scale-95"
                disabled={isLoading || cart.length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Complete Sale"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="p-4 bg-zinc-100 dark:bg-zinc-900/40 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Note</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Verify SKU authenticity before settlement.
          </p>
        </div>
      </div>
    </div>
  )
}
