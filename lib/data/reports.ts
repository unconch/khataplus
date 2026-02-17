"use server"

import { sql } from "../db";
import type { DailyReport } from "../types";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { authorize, audit } from "../security";

export async function getDailyReports(orgId: string, range: string = "month") {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    let days = 30;
    if (range === "today") days = 1;
    else if (range === "week") days = 7;
    else if (range === "month") days = 30;
    else if (range === "year") days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return nextCache(
        async (): Promise<DailyReport[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const data = await db`SELECT * FROM daily_reports WHERE org_id = ${orgId} AND report_date >= ${startDate.toISOString().split('T')[0]} ORDER BY report_date DESC`;
            return data.map((d: any) => ({
                ...d,
                total_sale_gross: parseFloat(d.total_sale_gross),
                total_cost: parseFloat(d.total_cost),
                expenses: parseFloat(d.expenses),
                cash_sale: parseFloat(d.cash_sale),
                online_sale: parseFloat(d.online_sale),
                online_cost: parseFloat(d.online_cost),
                report_date: d.report_date instanceof Date ? d.report_date.toISOString().split('T')[0] : String(d.report_date),
            })) as DailyReport[];
        },
        [`reports-list-${flavor}-${orgId}-${range}`],
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
}

export async function syncDailyReport(date: string, orgId?: string): Promise<void> {
    const { getCurrentOrgId } = await import("./auth");
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
}
