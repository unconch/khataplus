"use server"

import { sql, getDemoSql, getProductionSql } from "../db";
import type { DailyReport } from "../types";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { authorize, audit } from "../security";
import { triggerSync } from "../sync-notifier";
import { isGuestMode, getCurrentOrgId } from "./auth";

export async function getDailyReports(orgId: string, range: string = "month") {
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";
    const cacheVersion = "v4-today-strict-fix";

    let days = 30;
    if (range === "today") days = 0;
    else if (range === "week") days = 7;
    else if (range === "month") days = 30;
    else if (range === "year") days = 365;
    else if (range === "all") days = 365000;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return nextCache(
        async (): Promise<DailyReport[]> => {
            const db = isGuest ? getDemoSql() : getProductionSql();
            const startDateText = range === "all" ? "1900-01-01" : startDate.toISOString().split('T')[0]
            const salesCols = await db`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'sales'
            `
            const salesColSet = new Set((salesCols as any[]).map((r: any) => String(r.column_name)))
            const hasPaymentMethod = salesColSet.has("payment_method")
            const dailyReportCols = await db`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'daily_reports'
            `
            const dailyReportColSet = new Set((dailyReportCols as any[]).map((r: any) => String(r.column_name)))
            const hasDailyReportOrgId = dailyReportColSet.has("org_id")

            // Reports are derived from transactional data (sales + expenses) so
            // analytics and reports always reflect imported/recorded activity.
            const data = hasPaymentMethod ? await db`
                WITH sales_agg AS (
                    SELECT
                        sale_date::date AS report_date,
                        SUM(total_amount)::numeric AS total_sale_gross,
                        SUM(total_amount - profit)::numeric AS total_cost,
                        SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END)::numeric AS cash_sale,
                        SUM(CASE WHEN payment_method <> 'Cash' THEN total_amount ELSE 0 END)::numeric AS online_sale
                    FROM sales
                    WHERE org_id = ${orgId}
                      AND sale_date >= ${startDateText}::date
                    GROUP BY sale_date::date
                ),
                expenses_agg AS (
                    SELECT
                        expense_date::date AS report_date,
                        SUM(amount)::numeric AS expenses
                    FROM expenses
                    WHERE org_id = ${orgId}
                      AND expense_date::date >= ${startDateText}::date
                    GROUP BY expense_date::date
                )
                SELECT
                    TO_CHAR(COALESCE(s.report_date, e.report_date), 'YYYY-MM-DD') AS report_date,
                    COALESCE(s.total_sale_gross, 0)::numeric AS total_sale_gross,
                    COALESCE(s.total_cost, 0)::numeric AS total_cost,
                    COALESCE(e.expenses, 0)::numeric AS expenses,
                    COALESCE(s.cash_sale, 0)::numeric AS cash_sale,
                    COALESCE(s.online_sale, 0)::numeric AS online_sale,
                    CASE
                        WHEN COALESCE(s.total_sale_gross, 0) > 0
                        THEN (COALESCE(s.total_cost, 0) * COALESCE(s.online_sale, 0) / NULLIF(s.total_sale_gross, 0))
                        ELSE 0
                    END::numeric AS online_cost
                FROM sales_agg s
                FULL OUTER JOIN expenses_agg e ON s.report_date = e.report_date
                ORDER BY COALESCE(s.report_date, e.report_date) DESC
            ` : await db`
                WITH sales_agg AS (
                    SELECT
                        sale_date::date AS report_date,
                        SUM(total_amount)::numeric AS total_sale_gross,
                        SUM(total_amount - profit)::numeric AS total_cost,
                        SUM(total_amount)::numeric AS cash_sale,
                        0::numeric AS online_sale
                    FROM sales
                    WHERE org_id = ${orgId}
                      AND sale_date >= ${startDateText}::date
                    GROUP BY sale_date::date
                ),
                expenses_agg AS (
                    SELECT
                        expense_date::date AS report_date,
                        SUM(amount)::numeric AS expenses
                    FROM expenses
                    WHERE org_id = ${orgId}
                      AND expense_date::date >= ${startDateText}::date
                    GROUP BY expense_date::date
                )
                SELECT
                    TO_CHAR(COALESCE(s.report_date, e.report_date), 'YYYY-MM-DD') AS report_date,
                    COALESCE(s.total_sale_gross, 0)::numeric AS total_sale_gross,
                    COALESCE(s.total_cost, 0)::numeric AS total_cost,
                    COALESCE(e.expenses, 0)::numeric AS expenses,
                    COALESCE(s.cash_sale, 0)::numeric AS cash_sale,
                    COALESCE(s.online_sale, 0)::numeric AS online_sale,
                    0::numeric AS online_cost
                FROM sales_agg s
                FULL OUTER JOIN expenses_agg e ON s.report_date = e.report_date
                ORDER BY COALESCE(s.report_date, e.report_date) DESC
            `;

            const mappedDerived = (data as any[]).map((d: any) => {
                const dateText = String(d.report_date).slice(0, 10)
                return {
                    id: `derived-${orgId}-${dateText}`,
                    report_date: dateText,
                    total_sale_gross: parseFloat(d.total_sale_gross || "0"),
                    total_cost: parseFloat(d.total_cost || "0"),
                    expenses: parseFloat(d.expenses || "0"),
                    cash_sale: parseFloat(d.cash_sale || "0"),
                    online_sale: parseFloat(d.online_sale || "0"),
                    online_cost: parseFloat(d.online_cost || "0"),
                    expense_breakdown: [],
                    org_id: orgId,
                    created_at: dateText,
                    updated_at: dateText,
                } as DailyReport
            });

            if (mappedDerived.length > 0) {
                return mappedDerived;
            }

            // "Today" should be strict; do not backfill with older historical days.
            if (range === "today") {
                return [];
            }

            // If the current-date window is empty (common with old imported history),
            // fallback to latest available aggregated history so Reports/Analytics
            // still surface data.
            const dataAll = hasPaymentMethod ? await db`
                WITH sales_agg AS (
                    SELECT
                        sale_date::date AS report_date,
                        SUM(total_amount)::numeric AS total_sale_gross,
                        SUM(total_amount - profit)::numeric AS total_cost,
                        SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END)::numeric AS cash_sale,
                        SUM(CASE WHEN payment_method <> 'Cash' THEN total_amount ELSE 0 END)::numeric AS online_sale
                    FROM sales
                    WHERE org_id = ${orgId}
                    GROUP BY sale_date::date
                ),
                expenses_agg AS (
                    SELECT
                        expense_date::date AS report_date,
                        SUM(amount)::numeric AS expenses
                    FROM expenses
                    WHERE org_id = ${orgId}
                    GROUP BY expense_date::date
                )
                SELECT
                    TO_CHAR(COALESCE(s.report_date, e.report_date), 'YYYY-MM-DD') AS report_date,
                    COALESCE(s.total_sale_gross, 0)::numeric AS total_sale_gross,
                    COALESCE(s.total_cost, 0)::numeric AS total_cost,
                    COALESCE(e.expenses, 0)::numeric AS expenses,
                    COALESCE(s.cash_sale, 0)::numeric AS cash_sale,
                    COALESCE(s.online_sale, 0)::numeric AS online_sale,
                    CASE
                        WHEN COALESCE(s.total_sale_gross, 0) > 0
                        THEN (COALESCE(s.total_cost, 0) * COALESCE(s.online_sale, 0) / NULLIF(s.total_sale_gross, 0))
                        ELSE 0
                    END::numeric AS online_cost
                FROM sales_agg s
                FULL OUTER JOIN expenses_agg e ON s.report_date = e.report_date
                ORDER BY COALESCE(s.report_date, e.report_date) DESC
            ` : await db`
                WITH sales_agg AS (
                    SELECT
                        sale_date::date AS report_date,
                        SUM(total_amount)::numeric AS total_sale_gross,
                        SUM(total_amount - profit)::numeric AS total_cost,
                        SUM(total_amount)::numeric AS cash_sale,
                        0::numeric AS online_sale
                    FROM sales
                    WHERE org_id = ${orgId}
                    GROUP BY sale_date::date
                ),
                expenses_agg AS (
                    SELECT
                        expense_date::date AS report_date,
                        SUM(amount)::numeric AS expenses
                    FROM expenses
                    WHERE org_id = ${orgId}
                    GROUP BY expense_date::date
                )
                SELECT
                    TO_CHAR(COALESCE(s.report_date, e.report_date), 'YYYY-MM-DD') AS report_date,
                    COALESCE(s.total_sale_gross, 0)::numeric AS total_sale_gross,
                    COALESCE(s.total_cost, 0)::numeric AS total_cost,
                    COALESCE(e.expenses, 0)::numeric AS expenses,
                    COALESCE(s.cash_sale, 0)::numeric AS cash_sale,
                    COALESCE(s.online_sale, 0)::numeric AS online_sale,
                    0::numeric AS online_cost
                FROM sales_agg s
                FULL OUTER JOIN expenses_agg e ON s.report_date = e.report_date
                ORDER BY COALESCE(s.report_date, e.report_date) DESC
            `;

            const mappedAllDerived = (dataAll as any[]).map((d: any) => {
                const dateText = String(d.report_date).slice(0, 10)
                return {
                    id: `derived-${orgId}-${dateText}`,
                    report_date: dateText,
                    total_sale_gross: parseFloat(d.total_sale_gross || "0"),
                    total_cost: parseFloat(d.total_cost || "0"),
                    expenses: parseFloat(d.expenses || "0"),
                    cash_sale: parseFloat(d.cash_sale || "0"),
                    online_sale: parseFloat(d.online_sale || "0"),
                    online_cost: parseFloat(d.online_cost || "0"),
                    expense_breakdown: [],
                    org_id: orgId,
                    created_at: dateText,
                    updated_at: dateText,
                } as DailyReport
            });

            if (mappedAllDerived.length > 0) {
                return mappedAllDerived.slice(0, days);
            }

            // Fallback: if transactional derivation returns no rows (schema drift or partial imports),
            // use persisted daily_reports for the same range so Reports/Analytics still render data.
            const fallback = hasDailyReportOrgId ? await db`
                SELECT *
                FROM daily_reports
                WHERE org_id = ${orgId}
                  AND report_date >= ${startDateText}::date
                ORDER BY report_date DESC
            ` : await db`
                SELECT *
                FROM daily_reports
                WHERE report_date >= ${startDateText}::date
                ORDER BY report_date DESC
            `;

            const mappedFallback = (fallback as any[]).map((d: any) => ({
                id: String(d.id || `fallback-${orgId}-${String(d.report_date).slice(0, 10)}`),
                report_date: String(d.report_date).slice(0, 10),
                total_sale_gross: parseFloat(d.total_sale_gross || "0"),
                total_cost: parseFloat(d.total_cost || "0"),
                expenses: parseFloat(d.expenses || "0"),
                cash_sale: parseFloat(d.cash_sale || "0"),
                online_sale: parseFloat(d.online_sale || "0"),
                online_cost: parseFloat(d.online_cost || "0"),
                expense_breakdown: Array.isArray(d.expense_breakdown) ? d.expense_breakdown : [],
                org_id: String(d.org_id || orgId),
                created_at: String(d.created_at || ""),
                updated_at: String(d.updated_at || ""),
            })) as DailyReport[];

            if (mappedFallback.length > 0) {
                return mappedFallback;
            }

            // Final fallback: latest persisted reports regardless date window.
            const fallbackAll = hasDailyReportOrgId ? await db`
                SELECT *
                FROM daily_reports
                WHERE org_id = ${orgId}
                ORDER BY report_date DESC
                LIMIT ${days}
            ` : await db`
                SELECT *
                FROM daily_reports
                ORDER BY report_date DESC
                LIMIT ${days}
            `;

            return (fallbackAll as any[]).map((d: any) => ({
                id: String(d.id || `fallback-${orgId}-${String(d.report_date).slice(0, 10)}`),
                report_date: String(d.report_date).slice(0, 10),
                total_sale_gross: parseFloat(d.total_sale_gross || "0"),
                total_cost: parseFloat(d.total_cost || "0"),
                expenses: parseFloat(d.expenses || "0"),
                cash_sale: parseFloat(d.cash_sale || "0"),
                online_sale: parseFloat(d.online_sale || "0"),
                online_cost: parseFloat(d.online_cost || "0"),
                expense_breakdown: Array.isArray(d.expense_breakdown) ? d.expense_breakdown : [],
                org_id: String(d.org_id || orgId),
                created_at: String(d.created_at || ""),
                updated_at: String(d.updated_at || ""),
            })) as DailyReport[];
        },
        [`reports-list-${cacheVersion}-${flavor}-${orgId}-${range}`],
        { tags: ["reports", `reports-${orgId}`, `reports-${flavor}`], revalidate: 300 }
    )();
}

export async function addDailyReport(report: Omit<DailyReport, "id" | "created_at" | "updated_at">, orgId: string, userId?: string): Promise<DailyReport> {
    await authorize("Add Daily Report", "admin", orgId);

    const result = await sql`
        INSERT INTO daily_reports(report_date, total_sale_gross, total_cost, expenses, expense_breakdown, cash_sale, online_sale, online_cost, org_id)
        VALUES(${report.report_date}, ${report.total_sale_gross}, ${report.total_cost}, ${report.expenses}, ${JSON.stringify(report.expense_breakdown)}, ${report.cash_sale}, ${report.online_sale}, ${report.online_cost}, ${orgId})
        RETURNING *
    `;

    await audit("Added Daily Report", "report", result[0].id, { date: report.report_date }, orgId);

    (revalidateTag as any)("reports");
    (revalidateTag as any)(`reports-${orgId}`);
    revalidatePath("/dashboard/reports", "page");
    await triggerSync(orgId, "report");

    return result[0] as any;
}

export async function deleteDailyReport(id: string): Promise<void> {
    const report = await sql`SELECT * FROM daily_reports WHERE id = ${id}`;
    if (report.length === 0) return;

    const orgId = report[0].org_id;
    await authorize("Delete Daily Report", "admin", orgId);

    await sql`DELETE FROM daily_reports WHERE id = ${id}`;
    await audit("Deleted Daily Report", "report", id, { date: report[0].report_date }, orgId);

    (revalidateTag as any)("reports");
    (revalidateTag as any)(`reports-${orgId}`);
    revalidatePath("/dashboard/reports", "page");
    await triggerSync(orgId, "report");
}

export async function syncDailyReport(date: string, orgId?: string): Promise<void> {
    const actualOrgId = orgId || await getCurrentOrgId();
    if (!actualOrgId) throw new Error("Organization ID required");

    // 1. Check if there are any sales for this date
    const salesCheck = await sql`SELECT count(*) as count FROM sales WHERE sale_date = ${date} AND org_id = ${actualOrgId}`;
    if (parseInt(salesCheck[0].count) === 0) {
        console.log(`[Sync] No sales found for ${date} in ${actualOrgId}. Skipping sync.`);
        return;
    }

    // 2. Fetch sales aggregation for this date (Scoped to Organization)
    const salesAgg = await sql`
        SELECT
            SUM(total_amount) as total_gross,
            SUM(total_amount - profit) as total_cost_derived,
            SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END) as cash_total,
            SUM(CASE WHEN payment_method = 'UPI' THEN total_amount ELSE 0 END) as upi_total
        FROM sales
        WHERE sale_date = ${date} AND org_id = ${actualOrgId}
    `;

    const totalGross = parseFloat(salesAgg[0]?.total_gross || "0");
    const totalCost = parseFloat(salesAgg[0]?.total_cost_derived || "0");
    const cashTotal = parseFloat(salesAgg[0]?.cash_total || "0");
    const upiTotal = parseFloat(salesAgg[0]?.upi_total || "0");

    // 3. Update existing report or Create new
    const existing = await sql`SELECT * FROM daily_reports WHERE report_date = ${date} AND org_id = ${actualOrgId}`;

    if (existing.length > 0) {
        await sql`
            UPDATE daily_reports
            SET
                total_sale_gross = ${totalGross},
                total_cost = ${totalCost},
                cash_sale = ${cashTotal},
                online_sale = ${upiTotal},
                updated_at = CURRENT_TIMESTAMP
            WHERE report_date = ${date} AND org_id = ${actualOrgId}
        `;
    } else {
        await sql`
            INSERT INTO daily_reports(report_date, total_sale_gross, total_cost, cash_sale, online_sale, expenses, online_cost, org_id)
            VALUES(${date}, ${totalGross}, ${totalCost}, ${cashTotal}, ${upiTotal}, 0, 0, ${actualOrgId})
        `;
    }

    (revalidateTag as any)("reports");
    revalidatePath("/dashboard/reports", "page");
    await triggerSync(actualOrgId, "report");
}
