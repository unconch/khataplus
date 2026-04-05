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
        <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-zinc-100 bg-white/70 p-4 shadow-sm backdrop-blur-md animate-in fade-in slide-up dark:border-white/10 dark:bg-[rgba(30,41,59,0.62)] md:flex-row">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 rounded-2xl border-none bg-zinc-50 pl-11 font-semibold text-sm focus-visible:ring-emerald-500/20 dark:bg-[rgba(15,23,42,0.82)] dark:text-zinc-100"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <ImportDialog type="customer" orgId={orgId} />
                    <AddCustomerDialog orgId={orgId} onSuccess={(newCustomer: Customer) => setCustomers([newCustomer, ...customers])} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                {filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-zinc-100 bg-white/30 py-20 text-center animate-in fade-in zoom-in dark:border-white/10 dark:bg-[rgba(15,23,42,0.48)]">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[rgba(30,41,59,0.8)]">
                            <Search className="h-8 w-8 text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-black italic tracking-tighter text-zinc-900">No matching entries</h3>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Refine your search or add a new ledger</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <Link key={customer.id} href={`/dashboard/khata/${customer.id}`} className="group block no-underline">
                            <Card className="rounded-[2rem] border-transparent bg-zinc-50/50 shadow-none transition-all duration-300 group-active:scale-[0.98] hover-scale hover:border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50 dark:bg-[rgba(30,41,59,0.5)] dark:hover:border-white/10 dark:hover:bg-[rgba(30,41,59,0.82)] dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-200 transition-transform group-hover:scale-110">
                                            {customer.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-950 text-base leading-tight group-hover:text-emerald-600 transition-colors">{customer.name}</p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                <Phone className="h-3 w-3" />
                                                {customer.phone}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className={cn(
                                                "flex items-center justify-end font-black italic text-xl tracking-tighter",
                                                (customer.balance || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                <span className="text-xs font-bold mr-0.5 not-italic">₹</span>
                                                {Math.abs(customer.balance || 0).toLocaleString()}
                                            </div>
                                            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-400 mt-0.5">
                                                {(customer.balance || 0) >= 0 ? "Receivable" : "Payable"}
                                            </p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-100 bg-white shadow-sm transition-all group-hover:bg-emerald-500 group-hover:text-white dark:border-white/10 dark:bg-[rgba(15,23,42,0.84)]">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
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
