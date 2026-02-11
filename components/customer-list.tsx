"use client"

import { useState } from "react"
import { Customer } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, UserPlus, Phone, MapPin, IndianRupee, ChevronRight } from "lucide-react"
import { AddCustomerDialog } from "@/components/add-customer-dialog"
import { ImportDialog } from "@/components/import-dialog"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CustomerListProps {
    customers: Customer[]
    orgId: string
}

export function CustomerList({ customers: initialCustomers, orgId }: CustomerListProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [customers, setCustomers] = useState(initialCustomers)

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-muted/50 border-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ImportDialog type="customer" orgId={orgId} />
                    <AddCustomerDialog orgId={orgId} onSuccess={(newCustomer: Customer) => setCustomers([newCustomer, ...customers])} />
                </div>
            </div>

            <div className="grid gap-3">
                {filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No customers found</p>
                        <p className="text-sm text-muted-foreground">Try a different search or add a new customer</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <Link key={customer.id} href={`/dashboard/khata/${customer.id}`}>
                            <Card className="hover:bg-muted/50 transition-colors border-none shadow-none bg-muted/20">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {customer.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{customer.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                {customer.phone}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn(
                                            "flex items-center justify-end font-bold text-lg",
                                            (customer.balance || 0) >= 0 ? "text-emerald-500" : "text-destructive"
                                        )}>
                                            <IndianRupee className="h-4 w-4 mr-0.5" />
                                            {Math.abs(customer.balance || 0).toLocaleString()}
                                        </div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                            {(customer.balance || 0) >= 0 ? "You'll Get" : "You'll Give"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
