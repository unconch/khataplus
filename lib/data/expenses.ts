"use server"

import { sql } from "../db";
import type { Expense, ExpenseCategory } from "../types";
import { authorize, audit } from "../security";
import { revalidatePath, revalidateTag } from "next/cache";

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
    const data = await sql`SELECT * FROM expense_categories ORDER BY name ASC`;
    return data.map((d: any) => ({
        ...d,
        created_at: String(d.created_at)
    })) as ExpenseCategory[];
}

export async function addExpenseCategory(name: string): Promise<ExpenseCategory> {
    const result = await sql`
        INSERT INTO expense_categories(name) VALUES(${name}) 
        ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name
        RETURNING *
    `;
    return result[0] as any;
}

export async function getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const data = await sql`
        SELECT * FROM expenses 
        WHERE expense_date >= ${start.toISOString()} AND expense_date <= ${end.toISOString()}
        ORDER BY expense_date DESC, created_at DESC
    `;
    return data.map((d: any) => ({
        ...d,
        amount: parseFloat(d.amount),
        expense_date: d.expense_date instanceof Date ? d.expense_date.toISOString().split('T')[0] : String(d.expense_date),
        created_at: String(d.created_at)
    })) as Expense[];
}

export async function addExpense(expense: Omit<Expense, "id" | "created_at">, orgId: string): Promise<Expense> {
    const user = await authorize("Add Expense", undefined, orgId);

    const result = await sql`
        INSERT INTO expenses(category, amount, description, expense_date, created_by, org_id)
        VALUES(${expense.category}, ${expense.amount}, ${expense.description || null}, ${expense.expense_date}, ${user.id}, ${orgId})
        RETURNING *
    `;

    // Update daily report with new expense total
    const date = expense.expense_date;
    const currentReport = await sql`SELECT expenses, expense_breakdown FROM daily_reports WHERE report_date = ${date} AND org_id = ${orgId} `;

    let newTotal = parseFloat(result[0].amount);
    let newBreakdown: any[] = [];

    if (currentReport.length > 0) {
        newTotal += parseFloat(currentReport[0].expenses || 0);
        newBreakdown = currentReport[0].expense_breakdown || [];
    }

    // Add to breakdown
    newBreakdown.push({ category: expense.category, amount: parseFloat(result[0].amount) });

    // Update daily report
    if (currentReport.length > 0) {
        await sql`
            UPDATE daily_reports 
            SET expenses = ${newTotal}, expense_breakdown = ${JSON.stringify(newBreakdown)}, updated_at = CURRENT_TIMESTAMP
            WHERE report_date = ${date} AND org_id = ${orgId}
        `;
    } else {
        await sql`
            INSERT INTO daily_reports(report_date, expenses, expense_breakdown, total_sale_gross, total_cost, cash_sale, online_sale, online_cost, org_id)
            VALUES(${date}, ${newTotal}, ${JSON.stringify(newBreakdown)}, 0, 0, 0, 0, 0, ${orgId})
        `;
    }

    await audit("Added Expense", "expense", result[0].id, { category: expense.category, amount: expense.amount }, orgId);

    (revalidateTag as any)("reports");
    (revalidateTag as any)(`reports-${orgId}`);
    revalidatePath("/dashboard/reports", "page");

    return result[0] as any;
}

export async function deleteExpense(id: string, orgId: string): Promise<void> {
    await authorize("Delete Expense", "admin", orgId);

    const expenseRecord = await sql`SELECT * FROM expenses WHERE id = ${id} AND org_id = ${orgId}`;
    if (expenseRecord.length === 0) return;

    const amount = parseFloat(expenseRecord[0].amount);
    const date = new Date(expenseRecord[0].expense_date).toISOString().split('T')[0];

    await sql`DELETE FROM expenses WHERE id = ${id} AND org_id = ${orgId}`;

    // Update daily report
    const currentReport = await sql`SELECT expenses, expense_breakdown FROM daily_reports WHERE report_date = ${date} AND org_id = ${orgId} `;
    if (currentReport.length > 0) {
        const currentTotal = parseFloat(currentReport[0].expenses || 0);
        const newTotal = Math.max(0, currentTotal - amount);
        const currentBreakdown: any[] = currentReport[0].expense_breakdown || [];
        const index = currentBreakdown.findIndex((b: any) => b.category === expenseRecord[0].category && b.amount === amount);
        if (index !== -1) {
            currentBreakdown.splice(index, 1);
        }

        await sql`
            UPDATE daily_reports 
            SET expenses = ${newTotal}, expense_breakdown = ${JSON.stringify(currentBreakdown)}, updated_at = CURRENT_TIMESTAMP
            WHERE report_date = ${date} AND org_id = ${orgId}
        `;
    }

    await audit("Deleted Expense", "expense", id, { amount: amount, category: expenseRecord[0].category }, orgId);

    (revalidateTag as any)("reports");
    (revalidateTag as any)(`reports-${orgId}`);
    revalidatePath("/dashboard/reports", "page");
}
