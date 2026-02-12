"use client"

import { useState, useEffect, useMemo } from "react"
import {
    IndianRupee, Percent, Plus, Minus, History, Trash2,
    Smartphone, Receipt, ShieldCheck, Share2, FileDown,
    Calculator, Info, Search, AlertCircle, TrendingDown,
    ChevronDown, ChevronUp, Copy, Check, ExternalLink,
    HelpCircle, Tag
} from "lucide-react"
import { hsnMasterData as hsnData, HSN_CATEGORIES } from "@/lib/hsn-master"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PriceDisplay } from "@/components/ui/price-display"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface GSTItem {
    id: string
    name: string
    amount: string
    gstRate: number
    quantity: number
    discount: string
    discountType: "percentage" | "flat"
}

export function GSTCalculator() {
    // Basic States
    const [activeTab, setActiveTab] = useState("calculator")
    const [tradeType, setTradeType] = useState<"intra" | "inter">("intra")
    const [calculationType, setCalculationType] = useState<"exclusive" | "inclusive">("exclusive")
    const [history, setHistory] = useState<any[]>([])

    // Calculator Items
    const [items, setItems] = useState<GSTItem[]>([
        { id: "1", name: "", amount: "", gstRate: 18, quantity: 1, discount: "", discountType: "percentage" }
    ])

    // Compliance States
    const [taxLiability, setTaxLiability] = useState({ output: "", input: "" })
    const [lateFeeDays, setLateFeeDays] = useState("")

    // HSN Search
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [selectedRate, setSelectedRate] = useState<number | null>(null)

    const rates = [0, 5, 12, 18, 28, 40]

    // Memoized Results
    const results = useMemo(() => {
        let totalBase = 0
        let totalGST = 0
        let totalTaxable = 0

        const itemBreakdowns = items.map(item => {
            const price = parseFloat(item.amount) || 0
            const qty = item.quantity || 1
            const rawSubtotal = price * qty

            let discVal = 0
            if (item.discount) {
                const dv = parseFloat(item.discount) || 0
                discVal = item.discountType === "percentage" ? (rawSubtotal * dv) / 100 : dv
            }

            const subtotalAfterDiscount = rawSubtotal - discVal
            let base, gst

            if (calculationType === "exclusive") {
                base = subtotalAfterDiscount
                gst = (base * item.gstRate) / 100
            } else {
                const total = subtotalAfterDiscount
                base = (total * 100) / (100 + item.gstRate)
                gst = total - base
            }

            totalBase += base
            totalGST += gst
            totalTaxable += (base + gst)

            return {
                ...item,
                base,
                gst,
                total: base + gst
            }
        })

        const roundedTotal = Math.round(totalTaxable)
        const roundDiff = roundedTotal - totalTaxable

        return {
            items: itemBreakdowns,
            totalBase,
            totalGST,
            totalTaxable,
            roundedTotal,
            roundDiff,
            cgst: tradeType === "intra" ? totalGST / 2 : 0,
            sgst: tradeType === "intra" ? totalGST / 2 : 0,
            igst: tradeType === "inter" ? totalGST : 0
        }
    }, [items, calculationType, tradeType])

    // Actions
    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), name: "", amount: "", gstRate: 18, quantity: 1, discount: "", discountType: "percentage" }])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: string, updates: Partial<GSTItem>) => {
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
    }

    const handleShare = () => {
        const text = `*GST Quote Breakdown*\n\n` +
            results.items.map(i => `${i.name || 'Item'}: ₹${i.total.toFixed(2)} (${i.gstRate}%)`).join('\n') +
            `\n\nTotal Base: ₹${results.totalBase.toFixed(2)}` +
            `\nTotal GST: ₹${results.totalGST.toFixed(2)}` +
            `\n*Grand Total: ₹${results.roundedTotal}*` +
            `\n\nGenerated via KhataPlus`

        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const generatePDF = async () => {
        try {
            const { jsPDF } = await import('jspdf')
            const autoTable = (await import('jspdf-autotable')).default

            const doc = new jsPDF()

            // Header
            doc.setFontSize(22)
            doc.setTextColor(16, 185, 129) // Emerald-500
            doc.text('GST ESTIMATE', 105, 20, { align: 'center' })

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text('Generated via KhataPlus Professional GST Tool', 105, 28, { align: 'center' })

            // Date
            doc.setFontSize(10)
            doc.setTextColor(0)
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 45)
            doc.text(`Type: ${tradeType === 'intra' ? 'Intra-State (CGST/SGST)' : 'Inter-State (IGST)'}`, 14, 52)

            // Table
            const tableData = results.items.map((item, idx) => [
                idx + 1,
                item.name || 'General Item',
                item.quantity,
                `INR ${parseFloat(item.amount).toFixed(2)}`,
                `${item.gstRate}%`,
                `INR ${item.gst.toFixed(2)}`,
                `INR ${item.total.toFixed(2)}`
            ])

            autoTable(doc, {
                startY: 60,
                head: [['#', 'Item Description', 'Qty', 'Unit Price', 'GST%', 'GST Amt', 'Total']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }
            })

            const finalY = (doc as any).lastAutoTable.finalY + 10

            // Totals
            doc.setFontSize(11)
            doc.text(`Total Base: INR ${results.totalBase.toFixed(2)}`, 140, finalY)
            doc.text(`Total GST: INR ${results.totalGST.toFixed(2)}`, 140, finalY + 7)

            doc.setLineWidth(0.5)
            doc.line(140, finalY + 10, 196, finalY + 10)

            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text(`GRAND TOTAL: INR ${results.roundedTotal.toLocaleString()}`, 140, finalY + 18)

            // Footer
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(150)
            doc.text('This is a computer generated document and does not require a signature.', 105, 280, { align: 'center' })

            doc.save(`GST_Estimate_${Date.now()}.pdf`)
            toast.success("PDF Generated Successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate PDF")
        }
    }

    const copyToClipboard = () => {
        const text = `Total: ₹${results.roundedTotal} | GST: ₹${results.totalGST.toFixed(2)}`
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!")
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                        GST PRO <span className="text-emerald-500">CALCULATOR</span>
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                        2025/2026 Compliant • Multi-Item • India Edition
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList className="grid grid-cols-3 h-12 bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200 dark:border-white/10">
                        <TabsTrigger value="calculator" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                            Quote
                        </TabsTrigger>
                        <TabsTrigger value="compliance" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                            Tax Law
                        </TabsTrigger>
                        <TabsTrigger value="hsn" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                            HSN Finder
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "calculator" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                    >
                        {/* LEFT: Inputs */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Controls */}
                            <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-white/5 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Supply Type</label>
                                    <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
                                        <button
                                            onClick={() => setTradeType("intra")}
                                            className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", tradeType === "intra" ? "bg-white text-emerald-600 shadow-sm" : "text-muted-foreground")}
                                        >Intra-State</button>
                                        <button
                                            onClick={() => setTradeType("inter")}
                                            className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", tradeType === "inter" ? "bg-white text-emerald-600 shadow-sm" : "text-muted-foreground")}
                                        >Inter-State</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Pricing Mode</label>
                                    <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
                                        <button
                                            onClick={() => setCalculationType("exclusive")}
                                            className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", calculationType === "exclusive" ? "bg-white text-emerald-600 shadow-sm" : "text-muted-foreground")}
                                        >Excl. GST</button>
                                        <button
                                            onClick={() => setCalculationType("inclusive")}
                                            className={cn("flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", calculationType === "inclusive" ? "bg-white text-emerald-600 shadow-sm" : "text-muted-foreground")}
                                        >Incl. GST</button>
                                    </div>
                                </div>
                            </div>

                            {/* Item List */}
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="bg-white dark:bg-zinc-950 p-5 rounded-[2rem] shadow-md border border-zinc-100 dark:border-white/5 group relative"
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-end">
                                            <div className="col-span-12 md:col-span-4 space-y-2">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Item Name {idx + 1}</label>
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                                    placeholder="e.g. Computer Hardware"
                                                    className="h-10 text-xs font-bold rounded-xl border-zinc-200 dark:border-white/10"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-3 space-y-2">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Price (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={item.amount}
                                                    onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                                                    placeholder="0.00"
                                                    className="h-10 text-xs font-bold rounded-xl border-zinc-200 dark:border-white/10"
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-2 space-y-2">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">GST %</label>
                                                <select
                                                    value={item.gstRate}
                                                    onChange={(e) => updateItem(item.id, { gstRate: parseInt(e.target.value) })}
                                                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent focus:ring-emerald-500"
                                                >
                                                    {rates.map(r => <option key={r} value={r}>{r}%</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-6 md:col-span-3 space-y-2">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Discount</label>
                                                <div className="flex gap-1">
                                                    <Input
                                                        value={item.discount}
                                                        onChange={(e) => updateItem(item.id, { discount: e.target.value })}
                                                        placeholder="0"
                                                        className="h-10 text-xs font-bold rounded-xl border-zinc-200 dark:border-white/10"
                                                    />
                                                    <button
                                                        onClick={() => updateItem(item.id, { discountType: item.discountType === 'percentage' ? 'flat' : 'percentage' })}
                                                        className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-white/5 rounded-xl text-xs font-black"
                                                    >
                                                        {item.discountType === 'percentage' ? '%' : '₹'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <Minus size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>

                            <Button
                                onClick={addItem}
                                variant="outline"
                                className="w-full h-14 border-dashed border-2 rounded-[2rem] hover:bg-emerald-50 group transition-all"
                            >
                                <Plus size={18} className="mr-2 text-emerald-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Row to Quote</span>
                            </Button>
                        </div>

                        {/* RIGHT: Results */}
                        <div className="lg:col-span-5 h-full sticky top-8">
                            <div className="bg-emerald-600 dark:bg-emerald-950 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden space-y-8">
                                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-10 -mt-10">
                                    <IndianRupee size={180} strokeWidth={3} />
                                </div>

                                <div className="space-y-1 relative z-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-100 opacity-70">Payable Amount (Rounded)</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl md:text-5xl font-black italic tracking-tighter">₹{results.roundedTotal.toLocaleString()}</span>
                                        <PriceDisplay amount={results.roundedTotal} size="sm" className="opacity-0" />
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-80">
                                        <span>Items Count</span>
                                        <span>{items.length} Units</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-black italic">
                                        <span className="text-emerald-200">Total Taxable</span>
                                        <span>₹{results.totalBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-black italic">
                                        <span className="text-emerald-200">Total GST ({items.length > 1 ? 'Mix' : `${items[0].gstRate}%`})</span>
                                        <span>₹{results.totalGST.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {tradeType === "intra" ? (
                                            <>
                                                <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-200 mb-1">CGST Breakdown</p>
                                                    <p className="font-black italic">₹{results.cgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-200 mb-1">SGST Breakdown</p>
                                                    <p className="font-black italic">₹{results.sgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-span-2 bg-white/10 rounded-2xl p-4 border border-white/10">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-200 mb-1">IGST (Integrated Tax)</p>
                                                <p className="font-black italic text-xl">₹{results.igst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10 pt-4">
                                    <Button
                                        onClick={handleShare}
                                        className="h-14 bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <Smartphone size={16} /> WhatsApp
                                    </Button>
                                    <Button
                                        onClick={generatePDF}
                                        className="h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 border border-white/10"
                                    >
                                        <FileDown size={16} /> Save PDF
                                    </Button>
                                    <Button
                                        onClick={copyToClipboard}
                                        variant="ghost"
                                        className="col-span-2 h-12 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-black text-[9px] uppercase tracking-[.2em]"
                                    >
                                        Copy Short Summary
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "compliance" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Late Fee Card */}
                            <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-white/5 space-y-6">
                                <div className="flex items-center gap-4 text-amber-500">
                                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                                        <AlertCircle size={24} />
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tight">Late Fee</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Days of Delay</label>
                                        <Input
                                            type="number"
                                            value={lateFeeDays}
                                            onChange={(e) => setLateFeeDays(e.target.value)}
                                            placeholder="Enter days"
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                    {lateFeeDays && (
                                        <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">Total Penalty</span>
                                                <span className="text-xl font-black text-amber-700 dark:text-amber-400">₹{(parseInt(lateFeeDays) * 50).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[8px] font-bold text-amber-600/60 uppercase tracking-widest leading-normal">
                                                Based on ₹50/day (₹25 CGST + ₹25 SGST) for delay in GSTR-3B filing.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Interest Calculator Card */}
                            <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-white/5 space-y-6">
                                <div className="flex items-center gap-4 text-rose-500">
                                    <div className="p-3 bg-rose-500/10 rounded-2xl">
                                        <Percent size={24} />
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tight">Interest (18%)</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tax Amount Due (₹)</label>
                                        <Input
                                            type="number"
                                            value={taxLiability.output}
                                            onChange={(e) => setTaxLiability({ ...taxLiability, output: e.target.value })}
                                            placeholder="Tax amount"
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                    {taxLiability.output && lateFeeDays && (
                                        <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400">Interest Owed</span>
                                                <span className="text-xl font-black text-rose-700 dark:text-rose-400">
                                                    ₹{((parseFloat(taxLiability.output) * 0.18 * parseInt(lateFeeDays)) / 365).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <p className="text-[8px] font-bold text-rose-600/60 uppercase tracking-widest">Calculated at 18% per annum for {lateFeeDays} days</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ITC Card */}
                            <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-white/5 space-y-6">
                                <div className="flex items-center gap-4 text-emerald-500">
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                        <TrendingDown size={24} />
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tight">Net Tax (ITC)</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Input Tax Credit (₹)</label>
                                        <Input
                                            value={taxLiability.input}
                                            onChange={(e) => setTaxLiability({ ...taxLiability, input: e.target.value })}
                                            placeholder="Tax paid on purchases"
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                    {taxLiability.output && taxLiability.input && (
                                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Tax Liability</span>
                                                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                                                    ₹{Math.max(0, (parseFloat(taxLiability.output) - parseFloat(taxLiability.input))).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest">Reduced by Input Tax Credit</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-white/5 p-6 rounded-3xl border border-zinc-100 dark:border-white/10 flex items-start gap-3">
                            <Info size={18} className="text-zinc-400 mt-1 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-wider">
                                <b>Disclaimer:</b> These calculations are estimates for educational purposes. GST laws change frequently (Source: CBIC/GST Council 2025). Please consult a CA or authorized Tax Professional for official filings.
                            </p>
                        </div>
                    </motion.div>
                )}

                {activeTab === "hsn" && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white dark:bg-zinc-950 rounded-[3rem] p-8 md:p-12 shadow-sm border border-zinc-100 dark:border-white/5 space-y-8"
                    >
                        <div className="max-w-xl mx-auto space-y-6 text-center">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black italic tracking-tight">HSN Code & Rate Finder</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Search common items to find their standard GST rates</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or code (e.g. Mobile, 3004)"
                                    className="h-16 pl-12 pr-6 rounded-2xl text-lg font-bold border-2 focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex flex-wrap justify-center gap-2">
                                {HSN_CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                            selectedCategory === cat
                                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md scale-105"
                                                : "bg-zinc-100 dark:bg-white/5 text-muted-foreground border-transparent hover:border-zinc-300"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground self-center mr-2">Tax Slab:</span>
                                {[0, 3, 5, 12, 18, 28].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setSelectedRate(selectedRate === r ? null : r)}
                                        className={cn(
                                            "w-12 h-8 rounded-lg text-[10px] font-black tracking-widest transition-all border",
                                            selectedRate === r
                                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-sm"
                                                : "bg-white dark:bg-white/5 text-muted-foreground border-zinc-200 dark:border-white/10 hover:border-zinc-400"
                                        )}
                                    >
                                        {r}%
                                    </button>
                                ))}
                                {selectedRate !== null && (
                                    <button
                                        onClick={() => setSelectedRate(null)}
                                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Popular:</span>
                                {["Rice", "Mobile", "Cement", "Shirt", "Medicine", "Gold"].map(pop => (
                                    <button
                                        key={pop}
                                        onClick={() => {
                                            setSearchTerm(pop);
                                            setSelectedCategory("All");
                                            setSelectedRate(null);
                                        }}
                                        className="text-[10px] font-bold text-zinc-500 hover:text-emerald-500 transition-colors"
                                    >
                                        {pop}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {hsnData
                                .filter(item => {
                                    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        item.code.includes(searchTerm);
                                    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
                                    const matchesRate = selectedRate === null || item.rate === selectedRate;
                                    return matchesSearch && matchesCategory && matchesRate;
                                })
                                .map(item => (
                                    <div
                                        key={item.code + item.name}
                                        className="p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 hover:border-emerald-500/50 transition-all cursor-default group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-emerald-500 transition-colors">HSN {item.code}</div>
                                            <div className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-[8px] font-black uppercase tracking-tighter opacity-60">
                                                {item.category}
                                            </div>
                                        </div>
                                        <div className="text-base font-black italic mb-3 leading-tight min-h-[40px]">{item.name}</div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-900 rounded-full border shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-black">{item.rate}% GST</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    // Add to calculator logic
                                                    const newItem = {
                                                        id: Date.now().toString(),
                                                        name: item.name,
                                                        amount: "",
                                                        gstRate: item.rate,
                                                        quantity: 1,
                                                        discount: "",
                                                        discountType: "percentage" as const
                                                    };
                                                    setItems([...items, newItem]);
                                                    setActiveTab("calculator");
                                                    toast.success(`Pre-filled ${item.name} in calculator!`);
                                                }}
                                                className="h-8 w-8 p-0 rounded-full hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                title="Apply to Calculator"
                                            >
                                                <Plus size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        {hsnData.filter(item => {
                            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.code.includes(searchTerm);
                            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
                            const matchesRate = selectedRate === null || item.rate === selectedRate;
                            return matchesSearch && matchesCategory && matchesRate;
                        }).length === 0 && (
                                <div className="text-center py-20 space-y-4">
                                    <div className="p-4 bg-zinc-100 dark:bg-white/5 rounded-full w-fit mx-auto">
                                        <Search size={32} className="text-muted-foreground opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black italic tracking-tight">No results found</p>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Try searching with a different keyword or category</p>
                                    </div>
                                </div>
                            )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KhataPlus Branding Call to Action */}
            <div className="mt-16 p-8 md:p-12 bg-zinc-900 rounded-[3rem] text-white relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Smartphone size={160} />
                </div>
                <div className="max-w-2xl relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/20">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Integrated Billing</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black tracking-tight italic">Need more than a calculator?</h3>
                    <p className="text-zinc-400 text-lg font-medium leading-relaxed">
                        KhataPlus automates these math puzzles for you. Generate GST bills, track payments, and get automated inventory alerts in one secure app.
                    </p>
                </div>
            </div>
        </div>
    )
}
