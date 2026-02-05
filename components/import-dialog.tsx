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
import { importInventory, importCustomers } from "@/lib/import"
import { toast } from "sonner"

interface ImportDialogProps {
    type: "inventory" | "customer"
    orgId: string
    trigger?: React.ReactNode
}

export function ImportDialog({ type, orgId, trigger }: ImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; count: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const label = type === "inventory" ? "Inventory Items" : "Customers"

    const downloadTemplate = () => {
        let csvContent = ""
        if (type === "inventory") {
            csvContent = "sku,name,buy_price,gst,stock\nPROD-001,Demo Product,100,18,50"
        } else {
            csvContent = "name,phone,address\nJohn Doe,9876543210,123 Business Lane"
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
            const reader = new FileReader()
            reader.onload = async (e) => {
                const content = e.target?.result as string
                try {
                    const res = type === "inventory"
                        ? await importInventory(content, orgId)
                        : await importCustomers(content, orgId)

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
                    <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Bulk Import
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import {label}</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk import your {label.toLowerCase()}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 bg-muted/5 gap-4">
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium">Processing File...</p>
                            </div>
                        ) : result ? (
                            <div className="flex flex-col items-center gap-2 text-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                <p className="text-sm font-bold">Import Complete!</p>
                                <p className="text-xs text-muted-foreground">{result.count} records processed successfully.</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => {
                                        setResult(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                >
                                    Upload Another
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 text-muted-foreground/50" />
                                <div className="text-center">
                                    <p className="text-sm font-medium">Choose a CSV file</p>
                                    <p className="text-xs text-muted-foreground mt-1">UTF-8 encoded CSV files only</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <Button onClick={() => fileInputRef.current?.click()}>
                                    Select File
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileDown className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-bold">Need a template?</p>
                                <p className="text-[10px] text-muted-foreground">Download our sample CSV format</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            Download
                        </Button>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-500 leading-normal">
                        <strong>Duplicate SKUs/Phones:</strong> Existing records will be updated if a matching SKU (for inventory) or Phone Number (for customers) is found.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
