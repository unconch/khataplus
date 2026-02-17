"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { InventoryItem } from "@/lib/types";

interface LowStockWidgetProps {
    items: InventoryItem[];
}

export function LowStockWidget({ items }: LowStockWidgetProps) {
    if (items.length === 0) return null;

    return (
        <div className="premium-glass p-8 rounded-[2rem] shadow-xl border-border/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
                <AlertCircle size={100} className="text-amber-500" />
            </div>

            <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle size={14} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Risk</span>
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter text-foreground">Low Stock <span className="text-amber-500">({items.length})</span></h3>
                </div>

                <div className="space-y-4">
                    {items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-background/30 p-3 rounded-2xl border border-border/10 group/item hover:bg-background/50 transition-colors">
                            <div className="space-y-0.5">
                                <p className="text-sm font-black tracking-tight">{item.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inventory Item</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black italic text-rose-500 tracking-tighter">{item.stock}</p>
                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Threshold: {item.min_stock}</p>
                            </div>
                        </div>
                    ))}

                    {items.length > 3 && (
                        <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest text-center">+ {items.length - 3} more critical alerts</p>
                    )}

                    <Button variant="outline" className="w-full h-12 rounded-2xl premium-glass border-border/50 hover:bg-background/20 font-black text-[10px] uppercase tracking-widest gap-2 active:scale-95 transition-all" asChild>
                        <Link href="/dashboard/inventory">
                            Manage Inventory
                            <ArrowRight size={14} />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
