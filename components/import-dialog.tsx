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
import { Upload, FileDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ImportDialogProps {
    type: "inventory" | "customer" | "supplier"
    orgId: string
    trigger?: React.ReactNode
}

export function ImportDialog({ type, orgId, trigger }: ImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; count: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const label = type === "inventory" ? "Inventory Items" : type === "customer" ? "Customers" : "Suppliers"

    const downloadTemplate = () => {
        let csvContent = ""
        if (type === "inventory") {
            csvContent = "sku,name,buy_price,gst,stock\nPROD-001,Demo Product,100,18,50"
        } else if (type === "customer") {
            csvContent = "name,phone,address\nJohn Doe,9876543210,123 Business Lane"
        } else {
            csvContent = "name,phone,address\nSupplier Corp,9998887776,456 Industrial Ave"
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
            const { importInventory, importCustomers, importSuppliers } = await import("@/lib/import")
            const reader = new FileReader()
            reader.onload = async (e) => {
                const content = e.target?.result as string
                try {
                    let res;
                    if (type === "inventory") {
                        res = await importInventory(content, orgId);
                    } else if (type === "customer") {
                        res = await importCustomers(content, orgId);
                    } else {
                        res = await importSuppliers(content, orgId);
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
                    <Button variant="outline" className="gap-2 rounded-2xl premium-glass border-border/10 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                        <Upload className="h-4 w-4" />
                        Bulk Import
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 border-0 bg-transparent shadow-none overflow-hidden">
                <div className="premium-glass p-8 rounded-[2.5rem] border-white/10 dark:border-white/5 space-y-8 relative shadow-2xl">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Upload size={14} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Injection Protocol</span>
                        </div>
                        <DialogTitle className="text-3xl font-black italic tracking-tighter text-foreground">Import <span className="text-primary">{label}.</span></DialogTitle>
                        <DialogDescription className="text-xs font-bold text-muted-foreground/70 leading-relaxed uppercase tracking-tight">
                            Synthesize your business database via professional CSV orchestration.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-[2rem] p-12 bg-primary/5 gap-4 group hover:bg-primary/10 transition-all cursor-pointer relative overflow-hidden" onClick={() => !isUploading && !result && fileInputRef.current?.click()}>
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
                                        <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Orchestrating Logic...</p>
                                </div>
                            ) : result ? (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 size={32} className="text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black italic tracking-tight uppercase">Success.</p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{result.count} records synthesized</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 px-6 rounded-xl premium-glass border-border/10 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all mt-2"
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
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload size={32} className="text-primary/60" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-black italic tracking-tight">Secure File Handshake</p>
                                        <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">UTF-8 Encoded CSV</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    <Button className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-2 pointer-events-none">
                                        Initialize Handshake
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-5 rounded-[2rem] premium-glass-strong border-white/20 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <FileDown className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">Architecture Schema</p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Download standard template</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl premium-glass border-border/10 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all" onClick={downloadTemplate}>
                                Clone
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">Conflict Resolution Protocol</p>
                            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                                System identifies duplicates via Unique ID. Existing data will be <span className="text-rose-500">archived & replaced</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
