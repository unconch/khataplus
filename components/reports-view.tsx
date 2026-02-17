"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Calendar, Download, TrendingUp, TrendingDown, DollarSign,
    ShoppingCart, CreditCard, Wallet, FileText, Filter,
    BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"

interface ReportsViewProps {
    orgId: string
    orgSlug: string
}

type TimeRange = "today" | "week" | "month" | "custom"

export function ReportsView({ orgId, orgSlug }: ReportsViewProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>("month")
    const [reports, setReports] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        totalExpenses: 0,
        totalSales: 0,
        avgOrderValue: 0,
        profitMargin: 0
    })

    useEffect(() => {
        fetchData()
    }, [timeRange])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch reports and expenses
            const [reportsRes, expensesRes] = await Promise.all([
                fetch(`/api/reports?orgId=${orgId}&range=${timeRange}`),
                fetch(`/api/expenses?orgId=${orgId}&range=${timeRange}`)
            ])

            const reportsData = await reportsRes.json()
            const expensesData = await expensesRes.json()

            setReports(reportsData.reports || [])
            setExpenses(expensesData.expenses || [])

            // Calculate stats
            const totalRevenue = reportsData.reports?.reduce((sum: number, r: any) => sum + (r.total_sale_gross || 0), 0) || 0
            const totalExpenses = expensesData.expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0
            const totalProfit = totalRevenue - totalExpenses
            const totalSales = reportsData.reports?.length || 0
            const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
            const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

            setStats({
                totalRevenue,
                totalProfit,
                totalExpenses,
                totalSales,
                avgOrderValue,
                profitMargin
            })
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const StatCard = ({ icon: Icon, label, value, change, trend }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${trend === "up" ? "bg-emerald-100" : trend === "down" ? "bg-red-100" : "bg-blue-100"
                    }`}>
                    <Icon className={`h-5 w-5 ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-blue-600"
                        }`} />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${trend === "up" ? "text-emerald-600" : "text-red-600"
                        }`}>
                        {trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {change}%
                    </div>
                )}
            </div>
            <p className="text-sm text-zinc-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
        </motion.div>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 bg-zinc-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 mb-2">Business Reports</h1>
                    <p className="text-zinc-600">Track performance, analyze trends, and make data-driven decisions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2">
                        <FileText className="h-4 w-4" />
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-3 bg-white rounded-xl p-2 border border-zinc-200 w-fit">
                {[
                    { key: "today", label: "Today" },
                    { key: "week", label: "This Week" },
                    { key: "month", label: "This Month" },
                    { key: "custom", label: "Custom Range" }
                ].map((range) => (
                    <button
                        key={range.key}
                        onClick={() => setTimeRange(range.key as TimeRange)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${timeRange === range.key
                            ? "bg-emerald-600 text-white shadow-md"
                            : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    change={12}
                    trend="up"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Net Profit"
                    value={formatCurrency(stats.totalProfit)}
                    change={8}
                    trend="up"
                />
                <StatCard
                    icon={CreditCard}
                    label="Total Expenses"
                    value={formatCurrency(stats.totalExpenses)}
                    change={5}
                    trend="down"
                />
                <StatCard
                    icon={ShoppingCart}
                    label="Total Sales"
                    value={stats.totalSales.toString()}
                    change={15}
                    trend="up"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900">Revenue Trend</h3>
                            <p className="text-sm text-zinc-600">Daily sales over time</p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-zinc-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={reports.slice(-30)}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="report_date"
                                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                                stroke="#a1a1aa"
                            />
                            <YAxis stroke="#a1a1aa" />
                            <Tooltip
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                formatter={(value: any) => formatCurrency(value)}
                            />
                            <Area
                                type="monotone"
                                dataKey="total_sale_gross"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Profit vs Expenses */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900">Profit vs Expenses</h3>
                            <p className="text-sm text-zinc-600">Financial breakdown</p>
                        </div>
                        <PieChart className="h-5 w-5 text-zinc-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                            <Pie
                                data={[
                                    { name: "Profit", value: stats.totalProfit, color: "#10b981" },
                                    { name: "Expenses", value: stats.totalExpenses, color: "#ef4444" }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                label
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(value)} />
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900">Recent Expenses</h3>
                        <p className="text-sm text-zinc-600">Last 30 days</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                </div>

                {expenses.length === 0 ? (
                    <div className="text-center py-12">
                        <Wallet className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                        <p className="text-zinc-500">No expenses recorded yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {expenses.slice(0, 10).map((expense: any) => (
                            <div
                                key={expense.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <CreditCard className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-900">{expense.category}</p>
                                        <p className="text-sm text-zinc-600">{expense.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-zinc-900">{formatCurrency(expense.amount)}</p>
                                    <p className="text-xs text-zinc-500">
                                        {format(new Date(expense.expense_date), "MMM dd, yyyy")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                    <p className="text-emerald-100 mb-2">Average Order Value</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <p className="text-blue-100 mb-2">Profit Margin</p>
                    <p className="text-3xl font-bold">{stats.profitMargin.toFixed(1)}%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <p className="text-purple-100 mb-2">Growth Rate</p>
                    <p className="text-3xl font-bold">+12.5%</p>
                </div>
            </div>
        </div>
    )
}
