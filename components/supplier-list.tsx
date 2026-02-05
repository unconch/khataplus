"use client"

import { useState } from "react"
import { Supplier } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IndianRupee, Search, UserPlus, Phone, MapPin, ChevronRight, Store } from "lucide-react"
import { AddSupplierDialog } from "@/components/add-supplier-dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface SupplierListProps {
    initialSuppliers: Supplier[]
    orgId: string
}

export function SupplierList({ initialSuppliers, orgId }: SupplierListProps) {
    const [suppliers, setSuppliers] = useState(initialSuppliers)
    const [searchQuery, setSearchQuery] = useState("")

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery)
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-muted/50 border-none"
                    />
                </div>
                <AddSupplierDialog orgId={orgId} onSuccess={(newSupplier: Supplier) => setSuppliers([newSupplier, ...suppliers])} />
            </div>

            <div className="grid gap-3">
                {filteredSuppliers.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                        <Store className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No suppliers found</p>
                    </div>
                ) : (
                    filteredSuppliers.map((supplier) => (
                        <Link key={supplier.id} href={`/home/suppliers/${supplier.id}`} className="block">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all border-l-4 border-l-transparent hover:border-l-primary group">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                                        {supplier.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{supplier.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {supplier.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {supplier.phone}</span>}
                                            {supplier.gstin && <span className="px-1.5 py-0.5 bg-primary/5 text-primary rounded border border-primary/10 text-[10px] uppercase font-bold tracking-tight">GST: {supplier.gstin}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Balance</p>
                                        <div className={cn(
                                            "font-bold text-lg flex items-center justify-end",
                                            (supplier.balance || 0) >= 0 ? "text-rose-500" : "text-emerald-500"
                                        )}>
                                            <IndianRupee className="h-4 w-4" />
                                            {Math.abs(supplier.balance || 0).toLocaleString()}
                                            <span className="text-[10px] ml-1 uppercase">
                                                {(supplier.balance || 0) >= 0 ? "You Give" : "You Get"}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
