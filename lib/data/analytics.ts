"use server"

import { sql } from "../db";
import { unstable_cache as nextCache } from "next/cache";

export async function getDailyPulse(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async () => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [sales, topItems] = await Promise.all([
                db`
                SELECT
                    COUNT(*) as total_sales,
                    SUM(total_amount) as total_revenue,
                    SUM(profit) as total_profit,
                    SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END) as cash_total,
                    SUM(CASE WHEN payment_method = 'UPI' THEN total_amount ELSE 0 END) as upi_total
                FROM sales
                WHERE org_id = ${orgId} AND created_at >= ${today.toISOString()}
            `,
                db`
                SELECT
                    i.name,
                    SUM(s.quantity) as total_qty,
                    SUM(s.total_amount) as total_amount
                FROM sales s
                JOIN inventory i ON s.inventory_id = i.id
                WHERE s.org_id = ${orgId} AND s.created_at >= ${today.toISOString()}
                GROUP BY i.name
                ORDER BY total_qty DESC
                LIMIT 3
            `
            ]);

            return {
                summary: {
                    total_sales: parseInt(sales[0]?.total_sales || "0"),
                    total_revenue: parseFloat(sales[0]?.total_revenue || "0"),
                    total_profit: parseFloat(sales[0]?.total_profit || "0"),
                    cash_total: parseFloat(sales[0]?.cash_total || "0"),
                    upi_total: parseFloat(sales[0]?.upi_total || "0")
                },
                topItems: topItems.map((item: any) => ({
                    name: item.name,
                    qty: parseInt(item.total_qty),
                    amount: parseFloat(item.total_amount)
                }))
            };
        },
        [`daily-pulse-${flavor}-${orgId}`],
        { tags: ["sales", `sales-${orgId}`, `sales-${flavor}`], revalidate: 300 }
    )();
}

export async function getExecutiveAnalytics(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async () => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Fetch all analytics data in parallel
            const [dailyTrends, itemDistribution, staffPerformance, stockSummary] = await Promise.all([
                db`
                SELECT
                    DATE(created_at) as date,
                    SUM(total_amount) as revenue,
                    SUM(profit) as profit
                FROM sales
                WHERE org_id = ${orgId} AND created_at >= ${thirtyDaysAgo.toISOString()}
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `,
                db`
                SELECT
                    i.name,
                    SUM(s.total_amount) as value
                FROM sales s
                JOIN inventory i ON s.inventory_id = i.id
                WHERE s.org_id = ${orgId} AND s.created_at >= ${thirtyDaysAgo.toISOString()}
                GROUP BY i.name
                ORDER BY value DESC
                LIMIT 5
            `,
                db`
                SELECT
                    p.name as staff_name,
                    p.email,
                    COUNT(s.id) as total_sales,
                    SUM(s.total_amount) as total_revenue
                FROM sales s
                JOIN profiles p ON s.user_id = p.id
                WHERE s.org_id = ${orgId} AND s.created_at >= ${thirtyDaysAgo.toISOString()}
                GROUP BY p.name, p.email
                ORDER BY total_revenue DESC
            `,
                db`
                SELECT
                    SUM(stock * buy_price) as total_inventory_value,
                    COUNT(*) as total_skus,
                    SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as low_stock_count
                FROM inventory
                WHERE org_id = ${orgId}
            `
            ]);

            return {
                dailyTrends: dailyTrends.map((d: any) => ({
                    date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
                    revenue: parseFloat(d.revenue),
                    profit: parseFloat(d.profit)
                })),
                itemDistribution: itemDistribution.map((i: any) => ({
                    name: i.name,
                    value: parseFloat(i.value)
                })),
                staffPerformance: staffPerformance.map((s: any) => ({
                    name: s.staff_name || s.email,
                    sales: parseInt(s.total_sales),
                    revenue: parseFloat(s.total_revenue)
                })),
                inventoryStats: {
                    totalValue: parseFloat(stockSummary[0]?.total_inventory_value || "0"),
                    totalSkus: parseInt(stockSummary[0]?.total_skus || "0"),
                    lowStock: parseInt(stockSummary[0]?.low_stock_count || "0")
                }
            };
        },
        [`executive-analytics-${flavor}-${orgId}`],
        { tags: ["sales", "inventory", `analytics-${orgId}`, `analytics-${flavor}`], revalidate: 60 }
    )();
}
