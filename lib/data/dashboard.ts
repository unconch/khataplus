"use server"

import { getDemoSql, getProductionSql } from "../db"
import { unstable_cache as nextCache } from "next/cache"
import { isGuestMode } from "./auth"

type DashboardOverview = {
    customersCount: number
    salesCount: number
    unpaidAmount: number
    payableAmount: number
    recentSales: Array<{
        id: string
        customer_name: string | null
        quantity: number
        sale_date: string
        total_amount: number
    }>
}

async function getHasSalesCustomerNameColumn(db: any): Promise<boolean> {
    const result = await db`
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'sales'
          AND column_name = 'customer_name'
        LIMIT 1
    `
    return result.length > 0
}

const getHasSalesCustomerNameColumnCached = nextCache(
    getHasSalesCustomerNameColumn,
    ["schema:sales:customer_name"],
    { revalidate: 86400 }
)

async function fetchDashboardOverview(orgId: string, isGuest: boolean): Promise<DashboardOverview> {
    const db = isGuest ? getDemoSql() : getProductionSql()

    const hasCustomerNameColumn = isGuest
        ? await getHasSalesCustomerNameColumn(db)
        : await getHasSalesCustomerNameColumnCached(db)

    const [
        customersCountResult,
        salesCountResult,
        recentSalesRaw,
        unpaidResult,
        payableResult
    ] = await Promise.all([
        db`SELECT COUNT(*)::int as count FROM customers WHERE org_id = ${orgId}`,
        db`SELECT COUNT(*)::int as count FROM sales WHERE org_id = ${orgId}`,
        hasCustomerNameColumn
            ? db`
                SELECT id, customer_name, quantity, sale_date, total_amount
                FROM sales
                WHERE org_id = ${orgId}
                ORDER BY created_at DESC
                LIMIT 5
              `
            : db`
                SELECT id, NULL::text AS customer_name, quantity, sale_date, total_amount
                FROM sales
                WHERE org_id = ${orgId}
                ORDER BY created_at DESC
                LIMIT 5
              `,
        db`
            SELECT COALESCE(SUM(balance), 0)::numeric as unpaid
            FROM (
                SELECT COALESCE(SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END), 0) as balance
                FROM customers c
                LEFT JOIN khata_transactions k ON c.id = k.customer_id
                WHERE c.org_id = ${orgId}
                GROUP BY c.id
            ) t
            WHERE t.balance > 0
        `,
        db`
            SELECT COALESCE(SUM(balance), 0)::numeric as payable
            FROM (
                SELECT COALESCE(SUM(CASE WHEN st.type = 'purchase' THEN st.amount ELSE -st.amount END), 0) as balance
                FROM suppliers s
                LEFT JOIN supplier_transactions st ON s.id = st.supplier_id
                WHERE s.org_id = ${orgId}
                GROUP BY s.id
            ) t
            WHERE t.balance > 0
        `
    ])

    return {
        customersCount: Number(customersCountResult?.[0]?.count || 0),
        salesCount: Number(salesCountResult?.[0]?.count || 0),
        unpaidAmount: Number(unpaidResult?.[0]?.unpaid || 0),
        payableAmount: Number(payableResult?.[0]?.payable || 0),
        recentSales: (recentSalesRaw as any[]).map((row: any) => ({
            ...row,
            customer_name: row.customer_name ?? null,
            quantity: Number(row.quantity || 0),
            total_amount: Number(row.total_amount || 0),
            sale_date: row.sale_date,
        })),
    }
}

const getDashboardOverviewCached = nextCache(
    fetchDashboardOverview,
    ["dashboard-overview"],
    { revalidate: 300 }
)

export async function getDashboardOverview(orgId: string): Promise<DashboardOverview> {
    const isGuest = await isGuestMode()
    return isGuest ? fetchDashboardOverview(orgId, true) : getDashboardOverviewCached(orgId, false)
}
