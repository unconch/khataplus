
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { FileDown, FileSpreadsheet, FileText, Download } from "lucide-react"
import { DailyReport } from "@/lib/types"
import { format } from "date-fns"


// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"

interface ExportDialogProps {
    reports: DailyReport[]
}

export function ExportDialog({ reports }: ExportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)


    const downloadCSV = () => {
        setIsExporting(true)
        try {
            // CSV Headers
            const headers = ["Date", "Total Sales", "Cash Sales", "Online Sales", "Total Cost", "Expenses", "Net Profit"]

            // Map Data
            const rows = reports.map(r => {
                const net = r.total_sale_gross - r.total_cost - r.expenses
                return [
                    format(new Date(r.report_date), "yyyy-MM-dd"),
                    r.total_sale_gross,
                    r.cash_sale,
                    r.online_sale,
                    r.total_cost,
                    r.expenses,
                    net
                ].join(",")
            })

            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", `khataplus_report_${format(new Date(), "yyyy-MM-dd")}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (e) {
            console.error(e)
        } finally {
            setIsExporting(false)
            setIsOpen(false)
        }
    }

    const downloadPDF = async () => {
        setIsExporting(true)
        // Dynamic import to avoid SSR issues if package is missing
        try {
            const jsPDF = (await import("jspdf")).default
            const autoTable = (await import("jspdf-autotable")).default

            const doc = new jsPDF()

            // Header
            doc.setFontSize(20)
            doc.setTextColor(40)
            doc.text("KhataPlus", 14, 22)

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(`Generated on: ${format(new Date(), "dd MMM, yyyy")}`, 14, 30)

            // Table
            const tableColumn = ["Date", "Sales", "Cash", "Online", "Cost", "Exp", "Net"]
            const tableRows = reports.map(r => {
                const net = r.total_sale_gross - r.total_cost - r.expenses
                return [
                    format(new Date(r.report_date), "dd/MM/yy"),
                    `Rs. ${r.total_sale_gross}`,
                    `Rs. ${r.cash_sale}`,
                    `Rs. ${r.online_sale}`,
                    `Rs. ${r.total_cost}`,
                    `Rs. ${r.expenses}`,
                    `Rs. ${net}`
                ]
            })

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [22, 163, 74] }, // Emerald color
                styles: { fontSize: 8 },
            })

            doc.save(`khataplus_report_${format(new Date(), "yyyy-MM-dd")}.pdf`)
        } catch (err) {
            console.error("PDF Export Error:", err)
            alert("Failed to generate PDF. Make sure library is loaded.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group relative flex items-center gap-2 px-6 py-3 bg-zinc-950/40 hover:bg-zinc-900/60 backdrop-blur-md border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-primary/5 active-scale"
            >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                    <FileDown className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white/90">Export Reports</span>
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[480px] glass-card bg-zinc-950/95 border-white/10 p-0 overflow-hidden shadow-3xl rounded-[2.5rem]">
                    <div className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-white">Export Reports</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">Choose your preferred format</DialogDescription>
                    </div>

                    <div className="p-8 pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={downloadCSV}
                                variant="ghost"
                                className="group flex flex-col items-center justify-center gap-4 h-40 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all duration-300 active-scale"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500">
                                    <FileSpreadsheet className="h-7 w-7" />
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-bold">CSV Ledger</div>
                                    <div className="text-[10px] font-medium text-muted-foreground/60 mt-0.5 group-hover:text-primary/70 transition-colors">Excel Compatible</div>
                                </div>
                            </Button>

                            <Button
                                onClick={downloadPDF}
                                variant="ghost"
                                disabled={isExporting} // Changed from isGeneratingPDF to isExporting
                                className="group flex flex-col items-center justify-center gap-4 h-40 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all duration-300 active-scale"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-500">
                                    {isExporting ? <Download className="h-7 w-7 animate-spin" /> : <FileText className="h-7 w-7" />} {/* Changed Loader2 to Download and isGeneratingPDF to isExporting */}
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-bold">PDF Document</div>
                                    <div className="text-[10px] font-medium text-muted-foreground/60 mt-0.5 group-hover:text-primary/70 transition-colors">Print Ready</div>
                                </div>
                            </Button>
                        </div>

                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Download className="h-4 w-4" />
                            </div>
                            <p className="text-[11px] font-medium text-muted-foreground/80">
                                You are about to export <span className="text-primary font-bold">{reports.length}</span> records.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/5"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
