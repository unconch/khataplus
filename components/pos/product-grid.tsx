"use client"

import { useState } from "react"
import { InventoryItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProductGridProps {
    items: InventoryItem[]
    onAdd: (item: InventoryItem) => void
}

export function ProductGrid({ items, onAdd }: ProductGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Explicitly unique categories
    const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[]
    const filteredItems = selectedCategory
        ? items.filter(item => item.category === selectedCategory)
        : items

    return (
        <div className="flex flex-col h-full bg-zinc-50/50">
            {/* Category Bar */}
            <div className="flex items-center gap-2 px-6 py-4 border-b bg-white overflow-x-auto no-scrollbar scroll-smooth">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                        "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
                        !selectedCategory
                            ? "bg-zinc-950 text-white border-zinc-950 shadow-xl shadow-zinc-950/20"
                            : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200 hover:text-zinc-600"
                    )}
                >
                    All Items
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
                            selectedCategory === cat
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20"
                                : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200 hover:text-zinc-600"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid Area */}
            <ScrollArea className="flex-1">
                <div className="p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onAdd(item)}
                            className="group relative flex flex-col p-5 bg-white border border-zinc-100 rounded-[2rem] text-left transition-all hover:border-emerald-500 hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.15)] active:scale-[0.98]"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-zinc-800 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                                    {item.name}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded-full">
                                        {item.sku}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-8 flex items-end justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">M.R.P</p>
                                    <p className="text-lg font-black text-zinc-950 italic">
                                        ₹{item.sell_price || item.buy_price}
                                    </p>
                                </div>

                                {/* Visual indicator for stock */}
                                {item.stock <= (item.min_stock || 5) ? (
                                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                )}
                            </div>

                            {/* Hover Glow */}
                            <div className="absolute inset-0 rounded-[2rem] border-2 border-emerald-500/0 group-hover:border-emerald-500/10 transition-all pointer-events-none" />
                        </button>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 rounded-[3rem] border border-dashed border-zinc-200">
                            <p className="text-sm font-bold text-zinc-400 italic">No products in this category</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
