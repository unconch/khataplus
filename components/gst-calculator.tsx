"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
    IndianRupee, Percent, Plus, Minus, History, Trash2,
    Smartphone, Receipt, ShieldCheck, Share2, FileDown,
    Calculator, Info, Search, AlertCircle, TrendingDown,
    ChevronDown, ChevronUp, Copy, Check, ExternalLink,
    HelpCircle, Tag, ArrowLeftRight, RotateCcw, Save
} from "lucide-react"
import { hsnMasterData as hsnData, HSN_CATEGORIES } from "@/lib/hsn-master"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PriceDisplay } from "@/components/ui/price-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

// --- Types ---

interface GSTItem {
    id: string
    name: string
    amount: string
    gstRate: number
    quantity: number
    discount: string
    discountType: "percentage" | "flat"
}

interface HistoryItem {
    id: string
    date: string
    items: GSTItem[]
    totalAmt: number
    totalTax: number
    type: "inclusive" | "exclusive"
}

// --- Constants ---
const GST_RATES = [0, 3, 5, 12, 18, 28]

export function GSTCalculator() {
    // Basic States
    const [activeTab, setActiveTab] = useState("calculator")
    const [calcMode, setCalcMode] = useState<"quick" | "detailed">("detailed")
    const [tradeType, setTradeType] = useState<"intra" | "inter">("intra")
    const [calculationType, setCalculationType] = useState<"exclusive" | "inclusive">("exclusive")

    // Quick Mode State
    const [quickAmount, setQuickAmount] = useState("")
    const [quickRate, setQuickRate] = useState(18)

    // Detailed Mode State
    const [items, setItems] = useState<GSTItem[]>([
        { id: "1", name: "", amount: "", gstRate: 18, quantity: 1, discount: "", discountType: "percentage" }
    ])

    // History
    const [history, setHistory] = useState<HistoryItem[]>([])

    // Compliance States
    const [taxLiability, setTaxLiability] = useState({ output: "", input: "" })
    const [lateFeeDays, setLateFeeDays] = useState("")

    // HSN Search
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [selectedRate, setSelectedRate] = useState<number | null>(null)

    // --- Effects ---

    // Load History
    useEffect(() => {
        const saved = localStorage.getItem("khata_gst_history")
        if (saved) {
            try { setHistory(JSON.parse(saved)) } catch (e) { console.error("History load failed", e) }
        }
    }, [])

    // --- Logic ---

    const results = useMemo(() => {
        let totalBase = 0
        let totalGST = 0
        let totalTaxable = 0

        // Quick Mode Logic
        if (calcMode === "quick") {
            const amt = parseFloat(quickAmount) || 0
            if (calculationType === "exclusive") {
                totalBase = amt
                totalGST = (amt * quickRate) / 100
                totalTaxable = amt + totalGST
            } else {
                // Inclusive (Reverse Calculation)
                totalTaxable = amt
                totalBase = (amt * 100) / (100 + quickRate)
                totalGST = amt - totalBase
            }
            const roundedTotal = Math.round(totalTaxable)
            return {
                items: [{ id: 'quick', name: 'Quick Item', amount: quickAmount, gstRate: quickRate, quantity: 1, base: totalBase, gst: totalGST, total: totalTaxable }] as any[],
                totalBase,
                totalGST,
                totalTaxable,
                roundedTotal,
                roundDiff: roundedTotal - totalTaxable,
                cgst: tradeType === "intra" ? totalGST / 2 : 0,
                sgst: tradeType === "intra" ? totalGST / 2 : 0,
                igst: tradeType === "inter" ? totalGST : 0
            }
        }

        // Detailed Mode Logic
        const itemBreakdowns = items.map(item => {
            const price = parseFloat(item.amount) || 0
            const qty = item.quantity || 1
            const rawSubtotal = price * qty

            let discVal = 0
            if (item.discount) {
                const dv = parseFloat(item.discount) || 0
                discVal = item.discountType === "percentage" ? (rawSubtotal * dv) / 100 : dv
            }

            const subtotalAfterDiscount = Math.max(0, rawSubtotal - discVal)
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

        return {
            items: itemBreakdowns,
            totalBase,
            totalGST,
            totalTaxable,
            roundedTotal,
            roundDiff: roundedTotal - totalTaxable,
            cgst: tradeType === "intra" ? totalGST / 2 : 0,
            sgst: tradeType === "intra" ? totalGST / 2 : 0,
            igst: tradeType === "inter" ? totalGST : 0
        }
    }, [items, calculationType, tradeType, calcMode, quickAmount, quickRate])

    // --- Actions ---

    const addToHistory = () => {
        if (results.totalBase === 0) return
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            items: calcMode === 'quick' ? results.items : items,
            totalAmt: results.roundedTotal,
            totalTax: results.totalGST,
            type: calculationType
        }
        const newHistory = [newItem, ...history].slice(0, 10) // Keep last 10
        setHistory(newHistory)
        localStorage.setItem("khata_gst_history", JSON.stringify(newHistory))
        toast.success("Saved to History")
    }

    const restoreHistory = (h: HistoryItem) => {
        if (h.items.length === 1 && h.items[0].id === 'quick') {
            setCalcMode('quick')
            setQuickAmount(h.items[0].amount)
            setQuickRate(h.items[0].gstRate)
        } else {
            setCalcMode('detailed')
            setItems(h.items)
        }
        setCalculationType(h.type)
        toast.info("Restored from history")
    }

    const clearHistory = () => {
        setHistory([])
        localStorage.removeItem("khata_gst_history")
        toast("History Cleared")
    }

    const handleCopy = () => {
        const lines = [
            `*GST Calculation* (${calculationType.toUpperCase()})`,
            `Base Amount: ₹${results.totalBase.toFixed(2)}`,
            `GST (${tradeType === 'intra' ? 'CGST+SGST' : 'IGST'}): ₹${results.totalGST.toFixed(2)}`,
            `*Grand Total: ₹${results.roundedTotal}*`
        ]
        navigator.clipboard.writeText(lines.join('\n'))
        toast.success("Summary Copied!")
    }

    // --- Render ---

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 font-sans bg-zinc-50 dark:bg-zinc-950 min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-zinc-900 dark:text-white">
                        GST <span className="text-emerald-500">PRO</span>
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                        Detailed Breakdown & Compliance Tools
                    </p>
                </div>

                <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl">
                    <button onClick={() => setActiveTab("calculator")} className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", activeTab === "calculator" ? "bg-white dark:bg-zinc-800 shadow text-emerald-600" : "text-zinc-400")}>Calculator</button>
                    <button onClick={() => setActiveTab("compliance")} className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", activeTab === "compliance" ? "bg-white dark:bg-zinc-800 shadow text-emerald-600" : "text-zinc-400")}>Tax Tools</button>
                    <button onClick={() => setActiveTab("hsn")} className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", activeTab === "hsn" ? "bg-white dark:bg-zinc-800 shadow text-emerald-600" : "text-zinc-400")}>HSN Finder</button>
                </div>
            </div>

            {/* Main Content */}
            {activeTab === "calculator" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-up duration-500">

                    {/* LEFT: Inputs */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Mode Switcher */}
                        <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex">
                            <button onClick={() => setCalcMode("quick")} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", calcMode === "quick" ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" : "text-zinc-400 hover:bg-zinc-50")}>
                                <Calculator size={16} /> Quick Check
                            </button>
                            <button onClick={() => setCalcMode("detailed")} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", calcMode === "detailed" ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" : "text-zinc-400 hover:bg-zinc-50")}>
                                <Receipt size={16} /> Detailed Quote
                            </button>
                        </div>

                        {/* Global Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-zinc-400 pl-1">GST Type</label>
                                <div className="flex bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1">
                                    <button onClick={() => setTradeType("intra")} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", tradeType === "intra" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}>Intra-State</button>
                                    <button onClick={() => setTradeType("inter")} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", tradeType === "inter" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}>Inter-State</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-zinc-400 pl-1">Calculation Logic</label>
                                <div className="flex bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1">
                                    <button onClick={() => setCalculationType("exclusive")} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", calculationType === "exclusive" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}>Excl. GST</button>
                                    <button onClick={() => setCalculationType("inclusive")} className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", calculationType === "inclusive" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400")}>Incl. GST</button>
                                </div>
                            </div>
                        </div>

                        {/* INPUT AREA */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 relative overflow-hidden">
                            {calcMode === "quick" ? (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-zinc-400">Amount (₹)</label>
                                        <Input
                                            type="number"
                                            value={quickAmount}
                                            onChange={(e) => setQuickAmount(e.target.value)}
                                            className="h-20 text-4xl font-black rounded-2xl border-2 focus:border-emerald-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-zinc-400">GST Rate</label>
                                        <div className="flex flex-wrap gap-2">
                                            {GST_RATES.map(r => (
                                                <button key={r} onClick={() => setQuickRate(r)}
                                                    className={cn("h-12 w-16 rounded-xl font-black text-sm border-2 transition-all",
                                                        quickRate === r ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-100 hover:border-zinc-300")}
                                                >
                                                    {r}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="relative bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 group">
                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                <div className="col-span-12 md:col-span-4 space-y-1">
                                                    <label className="text-[10px] font-bold uppercase text-zinc-400">Item Name</label>
                                                    <Input value={item.name} onChange={(e) => {
                                                        const newItems = [...items]; newItems[idx].name = e.target.value; setItems(newItems);
                                                    }} className="h-10 text-xs font-bold" placeholder="e.g. Laptop" />
                                                </div>
                                                <div className="col-span-6 md:col-span-3 space-y-1">
                                                    <label className="text-[10px] font-bold uppercase text-zinc-400">Price/Unit</label>
                                                    <Input type="number" value={item.amount} onChange={(e) => {
                                                        const newItems = [...items]; newItems[idx].amount = e.target.value; setItems(newItems);
                                                    }} className="h-10 text-xs font-bold" placeholder="0.00" />
                                                </div>
                                                <div className="col-span-3 md:col-span-2 space-y-1">
                                                    <label className="text-[10px] font-bold uppercase text-zinc-400">Qty</label>
                                                    <Input type="number" value={item.quantity} onChange={(e) => {
                                                        const newItems = [...items]; newItems[idx].quantity = parseInt(e.target.value) || 1; setItems(newItems);
                                                    }} className="h-10 text-xs font-bold" />
                                                </div>
                                                <div className="col-span-3 md:col-span-3 space-y-1">
                                                    <label className="text-[10px] font-bold uppercase text-zinc-400">GST %</label>
                                                    <select value={item.gstRate} onChange={(e) => {
                                                        const newItems = [...items]; newItems[idx].gstRate = parseInt(e.target.value); setItems(newItems);
                                                    }} className="w-full h-10 px-2 rounded-md border text-xs font-bold bg-transparent">
                                                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            {items.length > 1 && (
                                                <button onClick={() => {
                                                    setItems(items.filter(i => i.id !== item.id))
                                                }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => setItems([...items, { id: Date.now().toString(), name: "", amount: "", gstRate: 18, quantity: 1, discount: "", discountType: "percentage" }])}
                                        className="w-full border-dashed border-2 py-6 text-zinc-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50">
                                        <Plus size={16} className="mr-2" /> Add Another Item
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Results & Receipt */}
                    <div className="lg:col-span-5 relative space-y-6">

                        {/* The Receipt Card */}
                        <div className="bg-white text-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 relative">
                            {/* Receipt Header */}
                            <div className="bg-zinc-900 text-white p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Receipt size={120} /></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
                                    {calculationType === 'inclusive' ? 'REVERSE CALCULATION' : 'FORWARD CALCULATION'}
                                </p>
                                <h2 className="text-3xl font-black italic tracking-tighter">ESTIMATE</h2>
                            </div>

                            {/* Receipt Body */}
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-zinc-500">Base Amount</span>
                                    <span className="font-mono font-bold">₹{results.totalBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-emerald-600">Total GST ({quickRate}%)</span>
                                    <span className="font-mono font-bold text-emerald-600">+ ₹{results.totalGST.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="bg-zinc-50 p-4 rounded-xl space-y-2 border border-zinc-100 text-xs">
                                    <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Tax Breakdown</p>
                                    {tradeType === 'intra' ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span>CGST ({(results.items[0]?.gstRate || 0) / 2}%)</span>
                                                <span>₹{results.cgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>SGST ({(results.items[0]?.gstRate || 0) / 2}%)</span>
                                                <span>₹{results.sgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between">
                                            <span>IGST ({results.items[0]?.gstRate}%)</span>
                                            <span>₹{results.igst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Final Total */}
                                <div className="pt-4 border-t-2 border-dashed border-zinc-200 flex justify-between items-baseline">
                                    <span className="text-sm font-black uppercase tracking-widest text-zinc-900">Grand Total</span>
                                    <span className="text-4xl font-black tracking-tighter text-zinc-900">₹{results.roundedTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-zinc-50 p-4 grid grid-cols-2 gap-3 border-t border-zinc-100">
                                <Button onClick={handleCopy} variant="outline" className="h-10 text-xs font-bold uppercase"><Copy size={14} className="mr-2" /> Copy</Button>
                                <Button onClick={addToHistory} className="h-10 bg-zinc-900 text-white text-xs font-bold uppercase hover:bg-zinc-800"><Save size={14} className="mr-2" /> Save</Button>
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" className="col-span-2 h-8 text-[10px] uppercase font-bold text-zinc-400 hover:text-zinc-900"><History size={12} className="mr-1" /> View History</Button>
                                    </SheetTrigger>
                                    <SheetContent>
                                        <SheetHeader>
                                            <SheetTitle>Calculation History</SheetTitle>
                                            <SheetDescription>Recent calculations saved to this device.</SheetDescription>
                                        </SheetHeader>
                                        <div className="mt-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                            {history.length === 0 && <p className="text-center text-sm text-zinc-400 py-10">No history yet.</p>}
                                            {history.map(h => (
                                                <div key={h.id} onClick={() => restoreHistory(h)} className="p-4 rounded-xl border hover:border-emerald-500 cursor-pointer transition-all bg-zinc-50 hover:bg-white group relative">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-bold uppercase text-zinc-400">{h.date}</span>
                                                        <span className={cn("text-[9px] px-2 py-0.5 rounded font-bold uppercase", h.type === 'inclusive' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>{h.type}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-xs font-bold text-zinc-500">{h.items.length} Item(s)</p>
                                                            <p className="text-xs font-bold text-zinc-500">Tax: ₹{h.totalTax.toFixed(2)}</p>
                                                        </div>
                                                        <p className="text-lg font-black">₹{h.totalAmt}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {history.length > 0 && (
                                                <Button onClick={clearHistory} variant="ghost" className="w-full text-red-500 text-xs">Clear History</Button>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {activeTab === "compliance" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start animate-in fade-in slide-up duration-500">
                    {/* 1. Late Fee */}
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-white/5 space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><AlertCircle className="text-amber-500 fill-amber-100 dark:fill-amber-900/20" /> Late Fee</h3>
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Days Delayed</label>
                            <Input placeholder="0" value={lateFeeDays} onChange={(e) => setLateFeeDays(e.target.value)} type="number" className="h-10 text-xs font-bold" />
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-amber-700">Penalty</span>
                                    <span className="font-black text-amber-700 text-lg">₹{(parseInt(lateFeeDays || '0') * 50).toLocaleString()}</span>
                                </div>
                                <p className="text-[8px] mt-1 text-amber-600/60 font-medium">@ ₹50/day (CGST+SGST)</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Interest */}
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-white/5 space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><Percent className="text-rose-500 fill-rose-100 dark:fill-rose-900/20" /> Interest Calc</h3>
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Tax Due</label>
                            <Input type="number" value={taxLiability.output} onChange={(e) => setTaxLiability({ ...taxLiability, output: e.target.value })} placeholder="Amount" className="h-10 text-xs font-bold" />
                            <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/20">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-rose-700">Interest (18%)</span>
                                    <span className="font-black text-rose-700 text-lg">
                                        ₹{((parseFloat(taxLiability.output || '0') * 0.18 * parseInt(lateFeeDays || '0')) / 365).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <p className="text-[8px] mt-1 text-rose-600/60 font-medium">For {lateFeeDays || 0} days delay</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. ITC */}
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-white/5 space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><TrendingDown className="text-emerald-500 fill-emerald-100 dark:fill-emerald-900/20" /> Net Liability</h3>
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Input Credit (ITC)</label>
                            <Input type="number" value={taxLiability.input} onChange={(e) => setTaxLiability({ ...taxLiability, input: e.target.value })} placeholder="ITC Amount" className="h-10 text-xs font-bold" />
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-emerald-700">Net Payable</span>
                                    <span className="font-black text-emerald-700 text-lg">
                                        ₹{Math.max(0, (parseFloat(taxLiability.output || '0') - parseFloat(taxLiability.input || '0'))).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-[8px] mt-1 text-emerald-600/60 font-medium">After deducting ITC</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "hsn" && (
                /* HSN Finder (Kept mostly same but cleaner) */
                <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6 animate-in fade-in slide-up duration-500">
                    <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search HSN Codes..." className="h-14 text-lg font-bold" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {hsnData.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8).map(i => (
                            <div key={i.code} className="p-4 border rounded-xl hover:bg-zinc-50 cursor-pointer" onClick={() => { setCalcMode('quick'); setQuickRate(i.rate); setActiveTab('calculator'); toast.success(`Applied ${i.rate}% rate`); }}>
                                <div className="flex justify-between"><span className="text-xs font-bold text-zinc-400">{i.code}</span><span className="text-xs font-bold bg-zinc-100 px-1 rounded">{i.rate}%</span></div>
                                <p className="font-medium mt-1 truncate">{i.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
