"use client"

import { useState, useMemo, useEffect } from "react"
import {
    CheckCircle2,
    CalendarIcon,
    Loader2,
    Save,
    ShoppingBag,
    Banknote,
    Wallet,
    CreditCard,
    Receipt,
    Plus,
    Trash2,
    Calculator,
    Target,
    ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { addDailyReport } from "@/lib/data"
import { DailyReport } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DailyReportFormProps {
    initialData?: Partial<DailyReport>
    onSuccess?: () => void
    profileId: string
}

import { getExpenseCategories } from "@/lib/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DailyReportForm({ initialData, onSuccess, profileId }: DailyReportFormProps) {
    const [categories, setCategories] = useState<{ id?: string, name: string }[]>([])

    // Load categories on mount
    useEffect(() => {
        async function loadCategories() {
            try {
                const cats = await getExpenseCategories();
                setCategories(cats);
            } catch (e) {
                console.error("Failed to load expense categories", e);
            }
        }
        loadCategories();
    }, [])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [expenseList, setExpenseList] = useState<{ id: string; category: string; amount: string }[]>(
        initialData?.expense_breakdown?.map((e) => ({ id: Math.random().toString(36).substring(7), category: e.category, amount: e.amount.toString() })) ||
        [{ id: "1", category: "", amount: "" }]
    )

    const [formData, setFormData] = useState({
        report_date: initialData?.report_date || new Date().toISOString().split('T')[0],
        total_cost: initialData?.total_cost?.toString() || "",
        total_sale_gross: initialData?.total_sale_gross?.toString() || "",
        cash_sale: initialData?.cash_sale?.toString() || "",
        online_sale: initialData?.online_sale?.toString() || "",
        online_cost: initialData?.online_cost?.toString() || "",
    })

    const totals = useMemo(() => {
        const expenses = expenseList.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
        const gross = parseFloat(formData.total_sale_gross) || 0
        const cost = parseFloat(formData.total_cost) || 0
        const net = gross - cost - expenses
        return { expenses, gross, cost, net }
    }, [expenseList, formData])

    const addExpenseRow = () => {
        setExpenseList([...expenseList, { id: Math.random().toString(36).substring(7), category: "", amount: "" }])
    }

    const removeExpenseRow = (id: string) => {
        if (expenseList.length > 1) {
            setExpenseList(expenseList.filter(e => e.id !== id))
        } else {
            setExpenseList([{ id: "1", category: "", amount: "" }])
        }
    }

    const updateExpense = (id: string, field: 'category' | 'amount', value: string) => {
        setExpenseList(expenseList.map(e => e.id === id ? { ...e, [field]: value } : e))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await addDailyReport({
                report_date: formData.report_date,
                total_cost: parseFloat(formData.total_cost) || 0,
                total_sale_gross: parseFloat(formData.total_sale_gross) || 0,
                expenses: totals.expenses,
                expense_breakdown: expenseList
                    .filter(e => e.category && e.amount)
                    .map(e => ({ category: e.category, amount: parseFloat(e.amount) || 0 })),
                cash_sale: parseFloat(formData.cash_sale) || 0,
                online_sale: parseFloat(formData.online_sale) || 0,
                online_cost: parseFloat(formData.online_cost) || 0,
            }, profileId)

            setSuccess(true)
            setTimeout(() => {
                onSuccess?.()
            }, 5000)
        } catch (error) {
            toast.error("Failed to save daily report.")
        } finally {
            setLoading(false)
        }
    }

    // Minimalist Design Helpers
    const sectionHeaderClasses = "flex items-center gap-2 mb-3 mt-6 first:mt-0"
    const sectionTitleClasses = "text-sm font-medium text-foreground"
    const inputContainerClasses = "group relative flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20"
    const labelClasses = "text-xs font-medium text-muted-foreground group-focus-within:text-foreground transition-colors"
    const inputClasses = "h-9 bg-transparent border-none text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted-foreground/40 font-sans"

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-500">
                <div className="h-24 w-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-3xl font-black tracking-tight uppercase tracking-[0.1em]">Saved Successfully</h3>
                <p className="text-sm font-bold text-muted-foreground mt-2 max-w-[200px]">
                    Daily report for <span className="text-primary font-mono">{formData.report_date}</span> has been securely stored.
                </p>
                <div className="mt-8 flex items-center gap-2 text-muted-foreground/30">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Refreshing View...</span>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4 md:space-y-8 pb-32 md:pb-12 animate-in fade-in duration-500">
            {/* 1. Essential Meta */}
            <section>
                <div className={sectionHeaderClasses}>
                    <CalendarIcon className="h-3 w-3 text-primary/60" />
                    <h3 className={sectionTitleClasses}>Reporting Timeline</h3>
                </div>
                <div className={cn(inputContainerClasses, "flex-row items-center justify-between py-3")}>
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="date" className={labelClasses}>Snapshot Date</Label>
                        <input
                            id="date"
                            type="date"
                            className="bg-transparent border-none text-base font-bold focus:outline-none font-mono"
                            value={formData.report_date}
                            onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                            required
                        />
                    </div>
                </div>
            </section>

            {/* 2. Core Financials */}
            <section>
                <div className={sectionHeaderClasses}>
                    <Target className="h-3 w-3 text-primary/60" />
                    <h3 className={sectionTitleClasses}>Core Financial Metrics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={inputContainerClasses}>
                        <Label htmlFor="total_cost" className={labelClasses}>1. Inventory Cost (PRICE)</Label>
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-primary/30" />
                            <Input
                                id="total_cost"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="0"
                                className={inputClasses}
                                value={formData.total_cost}
                                onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className={inputContainerClasses}>
                        <Label htmlFor="total_sale_gross" className={labelClasses}>2. Gross Sales (SALE)</Label>
                        <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-emerald-500/30" />
                            <Input
                                id="total_sale_gross"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="0"
                                className={inputClasses}
                                value={formData.total_sale_gross}
                                onChange={(e) => setFormData({ ...formData, total_sale_gross: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Expenses Breakdown */}
            <section>
                <div className={cn(sectionHeaderClasses, "justify-between")}>
                    <div className="flex items-center gap-2">
                        <Receipt className="h-3 w-3 text-primary/60" />
                        <h3 className={sectionTitleClasses}>Operational Overhead (₹{totals.expenses.toLocaleString()})</h3>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={addExpenseRow} className="h-8 text-xs font-medium text-primary hover:bg-primary/10 px-3 rounded-lg">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Expense
                    </Button>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl p-4 border border-zinc-200 dark:border-white/5 space-y-3">
                    {expenseList.map((expense) => (
                        <div key={expense.id} className="grid grid-cols-12 gap-3 group/item">
                            <div className="col-span-7 bg-white dark:bg-zinc-800 rounded-xl flex items-center h-10 border border-zinc-100 dark:border-white/5 focus-within:border-primary/40 transition-all">
                                <Select
                                    value={expense.category}
                                    onValueChange={(val) => updateExpense(expense.id, 'category', val)}
                                >
                                    <SelectTrigger className="w-full border-none h-full bg-transparent focus:ring-0">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-4 bg-white dark:bg-zinc-800 rounded-xl px-3 flex items-center h-10 border border-zinc-100 dark:border-white/5 focus-within:border-primary/40 transition-all">
                                <span className="text-muted-foreground/40 mr-1.5 text-[10px] font-black">₹</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    className="bg-transparent border-none w-full text-xs font-black focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-white/5 font-mono"
                                    value={expense.amount}
                                    onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeExpenseRow(expense.id)}
                                className="col-span-1 flex items-center justify-center text-muted-foreground/20 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Sales Distribution */}
            <section>
                <div className={sectionHeaderClasses}>
                    <Wallet className="h-3 w-3 text-primary/60" />
                    <h3 className={sectionTitleClasses}>Revenue Distribution</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={inputContainerClasses}>
                        <Label htmlFor="cash_sale" className={labelClasses}>4. Physical Cash (CASH)</Label>
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-amber-500/30" />
                            <Input
                                id="cash_sale"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="0"
                                className={inputClasses}
                                value={formData.cash_sale}
                                onChange={(e) => setFormData({ ...formData, cash_sale: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className={inputContainerClasses}>
                        <Label htmlFor="online_sale" className={labelClasses}>5. Digital Assets (ON-LINE)</Label>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-500/30" />
                            <Input
                                id="online_sale"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="0"
                                className={inputClasses}
                                value={formData.online_sale}
                                onChange={(e) => setFormData({ ...formData, online_sale: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className={cn(inputContainerClasses, "mt-4")}>
                    <Label htmlFor="online_cost" className={labelClasses}>6. Digital Buy Value (BRACKET)</Label>
                    <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-purple-500/30" />
                        <Input
                            id="online_cost"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0"
                            className={inputClasses}
                            value={formData.online_cost}
                            onChange={(e) => setFormData({ ...formData, online_cost: e.target.value })}
                            required
                        />
                    </div>
                </div>
            </section>

            {/* Submission Section */}
            {/* Sticky Mobile Footer / Static Desktop Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 md:static md:bg-transparent md:p-0 md:border-none md:pt-4 z-50 flex justify-end">
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto h-12 rounded-xl px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold text-sm shadow-lg shadow-primary/20"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Report
                            <ArrowRight className="h-3.5 w-3.5 hidden md:block" />
                        </span>
                    )}
                </Button>
            </div>
        </form>
    )
}
