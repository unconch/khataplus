"use client"

import { useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileDown, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImportDialogProps {
    type: "inventory" | "customer" | "supplier" | "sales" | "expense"
    orgId: string
    trigger?: React.ReactNode
}

export function ImportDialog({ type, orgId, trigger }: ImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; count: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const label =
        type === "inventory" ? "Inventory Items" :
            type === "customer" ? "Customers" :
                type === "supplier" ? "Suppliers" :
                    type === "sales" ? "Sales Records" :
                        "Expense Entries"

    const downloadTemplate = () => {
        let csvContent = ""
        if (type === "inventory") {
            csvContent = "sku,name,buy_price,gst,stock\nPROD-001,Demo Product,100,18,50"
        } else if (type === "customer") {
            csvContent = "name,phone,address\nJohn Doe,9876543210,123 Business Lane"
        } else if (type === "supplier") {
            csvContent = "name,phone,address\nSupplier Corp,9998887776,456 Industrial Ave"
        } else if (type === "sales") {
            csvContent = "sku,quantity,sale_price,sale_date,payment_method,customer_name\nPROD-001,5,150,2024-02-23,Cash,Walk-in Customer"
        } else if (type === "expense") {
            csvContent = "category,amount,description,expense_date\nRent,5000,Monthly Store Rent,2024-02-01"
        }

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}_template.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setResult(null)

        try {
            const { importInventory, importCustomers, importSuppliers, importSales, importExpenses } = await import("@/lib/import")
            const reader = new FileReader()
            reader.onload = async (e) => {
                const content = e.target?.result as string
                try {
                    let res;
                    if (type === "inventory") {
                        res = await importInventory(content, orgId);
                    } else if (type === "customer") {
                        res = await importCustomers(content, orgId);
                    } else if (type === "supplier") {
                        res = await importSuppliers(content, orgId);
                    } else if (type === "sales") {
                        res = await importSales(content, orgId);
                    } else if (type === "expense") {
                        res = await importExpenses(content, orgId);
                    }

                    setResult(res)
                    toast.success(`Successfully imported ${res.count} ${label}`)
                } catch (err: any) {
                    toast.error(err.message || "Import failed")
                } finally {
                    setIsUploading(false)
                }
            }
            reader.readAsText(file)
        } catch (err: any) {
            toast.error("Failed to read file")
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2 rounded-xl border-zinc-200 font-bold text-xs hover:bg-zinc-50 transition-all">
                        <Upload className="h-4 w-4" />
                        Bulk Import
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-2xl">
                <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 space-y-6 relative overflow-hidden border border-zinc-100 dark:border-white/5">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 opacity-30" />
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-50 dark:bg-emerald-500/5 rounded-full blur-3xl opacity-40" />

                    <DialogHeader className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
                                <Upload size={14} strokeWidth={2.5} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">DATA INJECTION PROTOCOL</span>
                        </div>

                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-black italic tracking-tighter text-zinc-950 dark:text-zinc-50 leading-none">
                                Import <span className="text-emerald-600">{label}.</span>
                            </DialogTitle>
                            <DialogDescription className="text-[11px] font-bold text-zinc-400 leading-tight uppercase tracking-tight max-w-[90%]">
                                Synthesize your business database via professional CSV orchestration.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 relative z-10">
                        {/* Dropzone Handshake */}
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 gap-4 transition-all cursor-pointer relative group",
                                isUploading ? "border-emerald-500/50 bg-emerald-50/10" : result ? "border-emerald-500 bg-emerald-50/5" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50"
                            )}
                            onClick={() => !isUploading && !result && fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-100/50 blur-2xl animate-pulse rounded-full" />
                                        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 relative z-10" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 animate-pulse">Orchestrating...</p>
                                </div>
                            ) : result ? (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in">
                                        <CheckCircle2 size={24} className="text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black italic tracking-tight uppercase text-zinc-950 dark:text-zinc-50">Success.</p>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{result.count} records synthesized</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-10 px-6 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all mt-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setResult(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = "";
                                            }
                                        }}
                                    >
                                        Inject New Batch
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="h-14 w-14 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-inner">
                                        <Upload size={24} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-black italic tracking-tighter text-zinc-950 dark:text-zinc-50 uppercase">Secure File Handshake</p>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">UTF-8 ENCODED CSV</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    <Button className="h-10 px-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all pointer-events-none group-hover:translate-y-[-2px]">
                                        INITIALIZE HANDSHAKE
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Architecture Schema Download */}
                        <div className="flex items-center justify-between p-3 pl-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-lg shadow-zinc-200/10 transition-all hover:border-zinc-300">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                    <FileDown className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[11px] font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">SCHEMA TEMPLATE</p>
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">STANDARD CSV CLONE</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-6 rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all"
                                onClick={downloadTemplate}
                            >
                                CLONE
                            </Button>
                        </div>
                    </div>

                    {/* Conflict Resolution Warning */}
                    <div className="flex items-start gap-4 p-5 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 group">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-600/20 text-amber-600 shadow-sm transition-transform group-hover:rotate-6">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">CONFLICT RESOLUTION PROTOCOL</p>
                            <p className="text-[10px] font-bold text-zinc-500/80 leading-tight uppercase tracking-tight">
                                Duplicates via Unique ID will be <span className="text-rose-500 underline decoration-2 underline-offset-4">archived & replaced</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
