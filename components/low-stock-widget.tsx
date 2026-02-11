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
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    Low Stock Alerts ({items.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500">Stock: <span className="font-bold text-rose-600">{item.stock}</span></span>
                                <span className="text-zinc-400">/ Threshold: {item.min_stock}</span>
                            </div>
                        </div>
                    ))}
                    {items.length > 3 && (
                        <p className="text-[10px] text-amber-600 font-medium">+ {items.length - 3} more items low on stock</p>
                    )}
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8 mt-2 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-900/40" asChild>
                        <Link href="/dashboard/inventory" className="flex items-center justify-center gap-2">
                            Manage Inventory
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
