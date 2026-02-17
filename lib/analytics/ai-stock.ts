"use server"

import { sql } from "../db";
import { unstable_cache as nextCache } from "next/cache";

/**
 * ALGORITHM 1 — Stockout Prediction
 * total_sold_last_30_days / 30 = avg_daily_sales
 * current_stock / avg_daily_sales = days_until_stockout
 */
export async function getStockHealth(orgId: string) {
    const { isGuestMode } = await import("../data/auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async () => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Fetch current stock and sales for all items
            const data = await db`
                SELECT 
                    i.id,
                    i.name,
                    i.stock,
                    COALESCE(SUM(s.quantity), 0) as total_sold,
                    MAX(s.created_at) as last_sold_date
                FROM inventory i
                LEFT JOIN sales s ON i.id = s.inventory_id AND s.created_at >= ${thirtyDaysAgo.toISOString()}
                WHERE i.org_id = ${orgId}
                GROUP BY i.id, i.name, i.stock
            `;

            return data.map((item: any) => {
                const totalSold = parseFloat(item.total_sold);
                const avgDaily = totalSold / 30;
                const stock = parseFloat(item.stock);

                let daysLeft = null;
                let status: 'Healthy' | 'Watch' | 'Reorder Now' | 'Dead Stock' = 'Healthy';

                if (avgDaily > 0) {
                    daysLeft = Math.floor(stock / avgDaily);
                    if (daysLeft < 3) status = 'Reorder Now';
                    else if (daysLeft < 11) status = 'Watch';
                } else if (stock > 0) {
                    const lastSold = item.last_sold_date ? new Date(item.last_sold_date) : null;
                    const fourteenDaysAgo = new Date();
                    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

                    if (!lastSold || lastSold < fourteenDaysAgo) {
                        status = 'Dead Stock';
                    }
                }

                return {
                    id: item.id,
                    name: item.name,
                    stock,
                    daysLeft,
                    status,
                    totalSold,
                    avgDaily
                };
            });
        },
        [`ai-stock-health-${flavor}-${orgId}`],
        { tags: ["inventory", "sales", `analytics-${orgId}`], revalidate: 3600 }
    )();
}

/**
 * ALGORITHM 3 — Reorder Suggestion
 * avg_daily_sales * 7 = suggested_reorder_qty
 * "Order 35 units to cover next week"
 */
export async function getReorderSuggestions(orgId: string) {
    const health = await getStockHealth(orgId);

    return health
        .filter(item => item.status === 'Reorder Now' || item.status === 'Watch')
        .map(item => ({
            id: item.id,
            name: item.name,
            currentStock: item.stock,
            suggestedQty: Math.ceil(item.avgDaily * 7),
            daysLeft: item.daysLeft
        }))
        .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0));
}

/**
 * Plain English Insights
 */
export async function getStockInsights(orgId: string) {
    const health = await getStockHealth(orgId);

    const deadStockCount = health.filter(item => item.status === 'Dead Stock').length;
    const reorderCount = health.filter(item => item.status === 'Reorder Now').length;

    // Fetch total revenue to calculate percentages
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [revData] = await sql`
        SELECT SUM(total_amount) as total_rev
        FROM sales
        WHERE org_id = ${orgId} AND created_at >= ${thirtyDaysAgo.toISOString()}
    `;
    const totalRev = parseFloat(revData.total_rev || "0");

    const insights = [];

    if (reorderCount > 0) {
        insights.push(`${reorderCount} items are running out in less than 3 days. Reorder now to avoid lost sales.`);
    }

    if (deadStockCount > 0) {
        insights.push(`${deadStockCount} items haven't sold in 14 days, tying up your capital.`);
    }

    // Top items logic
    const topItems = [...health].sort((a, b) => b.totalSold - a.totalSold).slice(0, 3);
    const topItemsRev = topItems.reduce((acc, item) => acc + (item.totalSold * 10), 0); // Mocking price for now since health doesn't have it

    // Better: just use totalSold volume for now
    if (health.length > 0) {
        const totalVolume = health.reduce((acc, item) => acc + item.totalSold, 0);
        const topVolume = topItems.reduce((acc, item) => acc + item.totalSold, 0);
        if (totalVolume > 0) {
            const pct = Math.round((topVolume / totalVolume) * 100);
            insights.push(`Your top 3 items drive ${pct}% of your sales volume.`);
        }
    }

    return insights;
}
