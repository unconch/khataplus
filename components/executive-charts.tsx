"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface ExecutiveChartsProps {
    data: Array<{
        date: string
        revenue: number
        profit: number
    }>
}

export function ExecutiveCharts({ data }: ExecutiveChartsProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    minTickGap={30}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px"
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1e293b"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                />
                <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
