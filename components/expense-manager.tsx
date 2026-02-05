
"use client"

import { useState, useCallback, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, PlusIcon, Trash2Icon, FileTextIcon } from "lucide-react"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
    Drawer,
    DrawerContent,
    DrawerHeader as DrawerHeaderComponent,
    DrawerTitle as DrawerTitleComponent,
    DrawerTrigger,
} from "@/components/ui/drawer"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { addExpense, getExpenses, deleteExpense } from "@/lib/data"
import type { Expense, ExpenseCategory } from "@/lib/types"

const DEFAULT_CATEGORIES = ["Rent", "Electricity", "Staff Wages", "Tea & Snacks", "Maintenance", "Transport", "Internet", "Water", "Cleaning", "Other"]

export function ExpenseManager({ userId }: { userId: string }) {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form states
    const [selectedCategory, setSelectedCategory] = useState("")
    const [customCategory, setCustomCategory] = useState("")
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [expenseDate, setExpenseDate] = useState<Date>(new Date())

    const isDesktop = useMediaQuery("(min-width: 768px)")

    const fetchExpenses = useCallback(async () => {
        try {
            // Default fetch last 30 days
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 30)
            const data = await getExpenses(start.toISOString(), end.toISOString())
            setExpenses(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load expenses")
        }
    }, [])

    useEffect(() => {
        fetchExpenses()
    }, [fetchExpenses])

    const handleSubmit = async () => {
        if (!amount || (!selectedCategory && !customCategory)) {
            toast.error("Please fill required fields")
            return
        }

        setLoading(true)
        try {
            const categoryToUse = selectedCategory === "new" ? customCategory : selectedCategory

            await addExpense({
                category: categoryToUse,
                amount: parseFloat(amount),
                description: description,
                expense_date: format(expenseDate, "yyyy-MM-dd"),
            }, userId)

            toast.success("Expense added")
            setIsDialogOpen(false)
            setAmount("")
            setDescription("")
            setSelectedCategory("")
            setCustomCategory("")
            fetchExpenses()
        } catch (error) {
            console.error(error)
            toast.error("Failed to add expense")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, amount: number) => {
        if (!confirm(`Delete expense of ₹${amount}?`)) return;
        try {
            await deleteExpense(id, userId)
            toast.success("Expense deleted")
            fetchExpenses()
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    // Group expenses by date
    const groupedExpenses = expenses.reduce((groups, expense) => {
        const date = expense.expense_date
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(expense)
        return groups
    }, {} as Record<string, Expense[]>)

    const renderForm = () => (
        <ExpenseForm
            categories={DEFAULT_CATEGORIES}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            customCategory={customCategory}
            setCustomCategory={setCustomCategory}
            amount={amount}
            setAmount={setAmount}
            expenseDate={expenseDate}
            setExpenseDate={setExpenseDate}
            description={description}
            setDescription={setDescription}
            loading={loading}
            onSubmit={handleSubmit}
        />
    )

    return (
        <Card className="glass-card bg-card/40 border-white/10">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <CardTitle>Expense Manager</CardTitle>
                    <CardDescription>Track daily shop expenditures (Tea, Wages, etc.)</CardDescription>
                </div>

                {isDesktop ? (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-lg shadow-rose-500/20">
                                <PlusIcon className="mr-2 h-4 w-4" /> Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Expense</DialogTitle>
                            </DialogHeader>
                            {renderForm()}
                        </DialogContent>
                    </Dialog>
                ) : (
                    <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DrawerTrigger asChild>
                            <Button className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-lg shadow-rose-500/20">
                                <PlusIcon className="mr-2 h-4 w-4" /> Add Expense
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <DrawerHeaderComponent className="text-left">
                                <DrawerTitleComponent>Add New Expense</DrawerTitleComponent>
                            </DrawerHeaderComponent>
                            <div className="px-4 pb-8">
                                {renderForm()}
                            </div>
                        </DrawerContent>
                    </Drawer>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                        <div key={date} className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(date), "EEEE, dd MMMM yyyy")}
                            </h4>
                            <div className="grid gap-3">
                                {groupedExpenses[date].map(ex => (
                                    <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg bg-black/5 hover:bg-black/10 border border-transparent hover:border-black/5 transition-all group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                                <FileTextIcon className="h-4 w-4 text-rose-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{ex.category}</p>
                                                {ex.description && <p className="text-xs text-muted-foreground truncate">{ex.description}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <p className="font-bold">₹{ex.amount.toLocaleString('en-IN')}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(ex.id, ex.amount)}
                                            >
                                                <Trash2Icon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {expenses.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                            No expenses recorded in the last 30 days.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function ExpenseForm({
    categories, selectedCategory, setSelectedCategory, customCategory, setCustomCategory,
    amount, setAmount, expenseDate, setExpenseDate, description, setDescription, loading, onSubmit
}: any) {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((c: string) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                        <SelectItem value="new">+ Create Business Category</SelectItem>
                    </SelectContent>
                </Select>
                {selectedCategory === "new" && (
                    <Input
                        placeholder="Enter new category name..."
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                    />
                )}
            </div>
            <div className="grid gap-2">
                <Label>Amount (₹)</Label>
                <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !expenseDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expenseDate ? format(expenseDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={expenseDate}
                            onSelect={(day) => day && setExpenseDate(day)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid gap-2">
                <Label>Description (Optional)</Label>
                <Input
                    placeholder="Details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <Button onClick={onSubmit} disabled={loading} className="w-full bg-rose-500 hover:bg-rose-600">
                {loading ? "Saving..." : "Save Expense"}
            </Button>
        </div>
    )
}
