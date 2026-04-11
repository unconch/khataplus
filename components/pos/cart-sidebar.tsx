"use client"

import { InventoryItem } from "@/lib/types"
import { PriceDisplay } from "@/components/ui/price-display"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Plus, Minus, Banknote, QrCode, ReceiptText } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CartItem {
    item: InventoryItem
    quantity: number
    price: number
}

interface CartSidebarProps {
    cart: CartItem[]
    onUpdateQty: (id: string, delta: number) => void
    onRemove: (id: string) => void
    onCheckout: (method: string) => void
    total: number
    tax: number
    gstEnabled: boolean
    gstInclusive: boolean
    isProcessing?: boolean
}

export function CartSidebar({
    cart,
    onUpdateQty,
    onRemove,
    onCheckout,
    total,
    tax,
    gstEnabled,
    gstInclusive,
    isProcessing = false
}: CartSidebarProps) {
    const subtotal = Math.max(0, total - tax)
    const effectiveTaxRate = subtotal > 0 ? (tax / subtotal) * 100 : 0

    return (
        <div className="flex flex-col h-full bg-white border-l border-zinc-100 shadow-2xl z-10">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter text-zinc-950 uppercase italic">Active Cart</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            {cart.reduce((sum, i) => sum + i.quantity, 0)} Units - {cart.length} SKUs
                        </span>
                    </div>
                </div>
                <ReceiptText size={24} className="text-zinc-200" />
            </div>

            <ScrollArea className="flex-1">
                <div className="divide-y divide-zinc-50">
                    {cart.map((cartItem) => (
                        <div key={cartItem.item.id} className="p-6 group relative hover:bg-zinc-50/50 transition-colors">
                            <div className="flex justify-between items-start gap-4">
                                <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-zinc-900 truncate leading-tight">{cartItem.item.name}</p>
                                    <p className="text-[10px] font-black text-emerald-600 mt-1 uppercase tracking-tight italic">
                                        Rate: Rs {cartItem.price.toFixed(2)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemove(cartItem.item.id)}
                                    className="flex h-11 w-11 items-center justify-center -mt-1 -mr-1 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-5">
                                <div className="flex items-center gap-1 p-1 bg-white border border-zinc-100 rounded-[1.25rem] shadow-sm">
                                    <button
                                        onClick={() => onUpdateQty(cartItem.item.id, -1)}
                                        className="h-11 w-11 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-90"
                                    >
                                        <Minus size={14} strokeWidth={3} />
                                    </button>
                                    <span className="w-10 text-center text-sm font-black text-zinc-950 tabular-nums">
                                        {cartItem.quantity}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQty(cartItem.item.id, 1)}
                                        className="h-11 w-11 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-90"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Sub-Total</p>
                                    <PriceDisplay amount={cartItem.price * cartItem.quantity} size="sm" className="font-black text-zinc-950 tabular-nums italic" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-40 px-10 text-center">
                            <div className="h-16 w-16 rounded-full bg-zinc-50 flex items-center justify-center mb-4 transition-colors">
                                <ReceiptText size={32} className="text-zinc-200" />
                            </div>
                            <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] italic">Waiting for items...</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-8 bg-zinc-50/80 border-t border-zinc-100 space-y-6 backdrop-blur-xl">
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white/50 px-4 py-2.5 rounded-xl border border-white/60">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Base Amount</span>
                        <span className="text-sm font-bold text-zinc-600 tabular-nums">Rs {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/50 px-4 py-2.5 rounded-xl border border-white/60">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                gstEnabled ? "text-emerald-600" : "text-zinc-400"
                            )}>
                                {gstEnabled ? `GST (${effectiveTaxRate.toFixed(1)}%)` : "Tax"}
                            </span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-md text-[8px] font-black",
                                gstEnabled
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-zinc-100 text-zinc-500"
                            )}>
                                {gstEnabled ? (gstInclusive ? "GST INCL" : "GST EXTRA") : "DISABLED"}
                            </span>
                        </div>
                        <span className={cn(
                            "text-sm font-bold tabular-nums",
                            gstEnabled ? "text-emerald-600" : "text-zinc-500"
                        )}>
                            {gstEnabled ? `+ Rs ${tax.toFixed(2)}` : "Rs 0.00"}
                        </span>
                    </div>

                    <div className="pt-4 flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Net Payable</span>
                        <PriceDisplay amount={total} size="lg" className="text-5xl font-black text-zinc-950 italic -tracking-[0.05em] tabular-nums" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        disabled={cart.length === 0 || isProcessing}
                        onClick={() => onCheckout("Cash")}
                        className="group h-16 rounded-[1.5rem] bg-zinc-950 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all hover:bg-zinc-800 hover:shadow-2xl hover:shadow-zinc-950/20 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <Banknote size={18} />
                        </div>
                        Cash
                    </button>
                    <button
                        disabled={cart.length === 0 || isProcessing}
                        onClick={() => onCheckout("UPI")}
                        className="group h-16 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-600/30 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <QrCode size={18} />
                        </div>
                        UPI Pay
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button className="h-11 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                        Apply Discount
                    </button>
                    <button className="h-11 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                        Hold Order
                    </button>
                </div>
            </div>
        </div>
    )
}
