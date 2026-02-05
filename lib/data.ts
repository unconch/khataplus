"use server"

import { sql } from "./db";
import type {
    InventoryItem, Sale, Profile, SystemSettings, AuditLog, DailyReport,
    ExpenseCategory, Expense, Customer, KhataTransaction, Organization,
    OrganizationMember, OrganizationInvite, Supplier, SupplierTransaction
} from "./types";
import { logHealthMetric, checkForFraud } from "./monitoring";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { cache } from "react";
import { authorize, audit, generateDiff } from "./security";

export async function getInventory(orgId: string) {
    return nextCache(
        async (): Promise<InventoryItem[]> => {
            const start = Date.now();
            const data = await sql`SELECT * FROM inventory WHERE org_id = ${orgId} ORDER BY name ASC`;
            await logHealthMetric(Date.now() - start, "getInventory");

            return data.map((item: any) => ({
                ...item,
                buy_price: parseFloat(item.buy_price),
                gst_percentage: parseFloat(item.gst_percentage),
            })) as InventoryItem[];
        },
        [`inventory-list-${orgId}`],
        { tags: ["inventory", `inventory-${orgId}`], revalidate: 3600 }
    )();
}

export async function addInventoryItem(item: Omit<InventoryItem, "id" | "created_at" | "updated_at">, orgId: string): Promise<InventoryItem> {
    await authorize("Add Inventory", "admin", orgId); // Requires admin or owner (admin is checked inside authorize)

    const result = await sql`
        INSERT INTO inventory(sku, name, buy_price, gst_percentage, stock, org_id)
        VALUES(${item.sku}, ${item.name}, ${item.buy_price}, ${item.gst_percentage}, ${item.stock}, ${orgId})
        RETURNING *
    `;
    const newItem = result[0] as any;
    const inventory = {
        ...newItem,
        buy_price: parseFloat(newItem.buy_price),
        gst_percentage: parseFloat(newItem.gst_percentage),
    } as InventoryItem;

    await audit("Added Inventory", "inventory", inventory.id, { name: inventory.name, sku: inventory.sku, stock: inventory.stock }, orgId);
    revalidatePath("/home/inventory", "page");

    return inventory;
}

export async function updateInventoryStock(id: string, newStock: number, orgId: string): Promise<void> {
    await authorize("Update Stock", undefined, orgId); // Any approved staff can update stock (e.g. from returns)

    const prevResult = await sql`SELECT name, stock FROM inventory WHERE id = ${id} AND org_id = ${orgId}`;
    if (prevResult.length === 0) throw new Error("Item not found");
    const prev = prevResult[0];

    await sql`
        UPDATE inventory 
        SET stock = ${newStock}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id} AND org_id = ${orgId}
`;

    await audit("Updated Stock", "inventory", id, {
        name: prev.name,
        old_stock: prev.stock,
        new_stock: newStock,
        org_id: orgId
    }, orgId);

    (revalidateTag as any)(`inventory-${orgId}`);
    revalidatePath("/home/inventory", "page");
}

export async function getSales(orgId: string) {
    return nextCache(
        async (): Promise<(Sale & { inventory?: InventoryItem })[]> => {
            const start = Date.now();
            const data = await sql`
                SELECT s.*, i.name as inventory_name, i.sku as inventory_sku, i.buy_price as inventory_buy_price
                FROM sales s
                LEFT JOIN inventory i ON s.inventory_id = i.id
                WHERE s.org_id = ${orgId}
                ORDER BY s.created_at DESC
        `;
            await logHealthMetric(Date.now() - start, "getSales");

            return data.map((row: any) => ({
                ...row,
                sale_price: parseFloat(row.sale_price),
                total_amount: parseFloat(row.total_amount),
                gst_amount: parseFloat(row.gst_amount),
                profit: parseFloat(row.profit),
                inventory: row.inventory_id ? {
                    id: row.inventory_id,
                    sku: row.inventory_sku,
                    name: row.inventory_name,
                    buy_price: parseFloat(row.inventory_buy_price),
                } : undefined
            })) as any;
        },
        [`sales-list-${orgId}`],
        { tags: ["sales", `sales-${orgId}`], revalidate: 3600 }
    )();
}

export async function recordSale(sale: Omit<Sale, "id" | "user_id" | "profit" | "created_at">, orgId: string): Promise<Sale> {
    const user = await authorize("Record Sale", undefined, orgId);

    // Get product to calculate cost and profit
    const productResult = await sql`SELECT name, buy_price, stock FROM inventory WHERE id = ${sale.inventory_id} AND org_id = ${orgId} `;
    if (productResult.length === 0) throw new Error("Inventory item not found");
    const product = productResult[0];

    if (product.stock < sale.quantity) throw new Error(`Insufficient stock. Available: ${product.stock} `);

    const profit = (sale.sale_price - parseFloat(product.buy_price)) * sale.quantity;

    const result = await sql`
        INSERT INTO sales(inventory_id, user_id, org_id, quantity, sale_price, total_amount, gst_amount, profit, payment_method, batch_id, sale_date)
        VALUES(${sale.inventory_id}, ${user.id}, ${orgId}, ${sale.quantity}, ${sale.sale_price}, ${sale.total_amount}, ${sale.gst_amount}, ${profit}, ${sale.payment_method}, ${sale.batch_id || null}, ${sale.sale_date})
        RETURNING *
    `;

    // Update stock
    await sql`UPDATE inventory SET stock = stock - ${sale.quantity} WHERE id = ${sale.inventory_id} AND org_id = ${orgId} `;

    const finalSale = result[0] as Sale;
    await audit("Recorded Sale", "sale", finalSale.id, {
        item: product.name,
        quantity: sale.quantity,
        total: sale.total_amount,
        org_id: orgId
    }, orgId);

    revalidatePath("/home", "page");
    revalidatePath("/home/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory-${orgId}`);

    return {
        ...finalSale,
        sale_price: parseFloat(finalSale.sale_price as any),
        total_amount: parseFloat(finalSale.total_amount as any),
        gst_amount: parseFloat(finalSale.gst_amount as any),
        profit: parseFloat(finalSale.profit as any),
    };
}

export async function recordBatchSales(sales: Omit<Sale, "id" | "user_id" | "sale_date" | "created_at">[], orgId: string): Promise<Sale[]> {
    const user = await authorize("Record Batch Sales", undefined, orgId);
    const batchId = crypto.randomUUID();

    const results = await Promise.all(sales.map(async (sale) => {
        // Get product to calculate profit and fetch HSN
        const productResult = await sql`SELECT name, buy_price, stock, hsn_code FROM inventory WHERE id = ${sale.inventory_id} AND org_id = ${orgId} `;
        if (productResult.length === 0) throw new Error(`Item ${sale.inventory_id} not found`);
        const product = productResult[0];

        const profit = (sale.sale_price - parseFloat(product.buy_price)) * sale.quantity;

        // Use provided HSN or fallback to product's HSN
        const hsnCode = sale.hsn_code || product.hsn_code;

        const result = await sql`
            INSERT INTO sales(inventory_id, user_id, org_id, quantity, sale_price, total_amount, gst_amount, profit, payment_method, batch_id, customer_gstin, hsn_code)
            VALUES(${sale.inventory_id}, ${user.id}, ${orgId}, ${sale.quantity}, ${sale.sale_price}, ${sale.total_amount}, ${sale.gst_amount}, ${profit}, ${sale.payment_method}, ${batchId}, ${sale.customer_gstin || null}, ${hsnCode || null})
            RETURNING *
        `;

        // Update stock
        await sql`UPDATE inventory SET stock = stock - ${sale.quantity} WHERE id = ${sale.inventory_id} AND org_id = ${orgId} `;

        return result[0];
    }));

    await audit("Recorded Batch Sales", "sale", batchId, { count: sales.length, org_id: orgId }, orgId);

    revalidatePath("/home", "page");
    revalidatePath("/home/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory-${orgId}`);

    return results.map((s: any) => ({
        ...s,
        sale_price: parseFloat(s.sale_price),
        total_amount: parseFloat(s.total_amount),
        gst_amount: parseFloat(s.gst_amount),
        profit: parseFloat(s.profit),
    })) as Sale[];
}

export async function processReturn(saleId: string, quantity: number, orgId: string): Promise<void> {
    await authorize("Process Return", undefined, orgId);

    const saleResult = await sql`SELECT * FROM sales WHERE id = ${saleId} AND org_id = ${orgId}`;
    if (saleResult.length === 0) throw new Error("Sale not found");
    const sale = saleResult[0];

    if (sale.quantity < quantity) throw new Error("Return quantity exceeds sale quantity");

    // Update sale or delete if fully returned
    if (sale.quantity === quantity) {
        await sql`DELETE FROM sales WHERE id = ${saleId} AND org_id = ${orgId}`;
    } else {
        await sql`
            UPDATE sales 
            SET quantity = quantity - ${quantity}, 
                total_amount = total_amount - (total_amount / quantity * ${quantity}),
                gst_amount = gst_amount - (gst_amount / quantity * ${quantity}),
                profit = profit - (profit / quantity * ${quantity}),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${saleId} AND org_id = ${orgId}
        `;
    }

    // Return stock to inventory
    await sql`UPDATE inventory SET stock = stock + ${quantity} WHERE id = ${sale.inventory_id} AND org_id = ${orgId}`;

    await audit("Processed Return", "sale", saleId, { quantity }, orgId);
    revalidatePath("/home/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory-${orgId}`);
}

export async function updateSale(saleId: string, updates: Partial<Sale>, orgId: string): Promise<void> {
    await authorize("Update Sale", undefined, orgId);

    const prevResult = await sql`SELECT * FROM sales WHERE id = ${saleId} AND org_id = ${orgId}`;
    if (prevResult.length === 0) throw new Error("Sale not found");
    const prev = prevResult[0];

    // Validate 5-minute window for safety
    const diffMs = Date.now() - new Date(prev.created_at).getTime();
    if (diffMs > 5 * 60 * 1000) {
        throw new Error("Sale is locked (5-minute edit window expired)");
    }

    // Adjust Inventory Stock before updating sale
    if (updates.quantity !== undefined && updates.quantity !== prev.quantity) {
        const diffQty = updates.quantity - prev.quantity;
        await sql`
            UPDATE inventory 
            SET stock = stock - ${diffQty}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${prev.inventory_id} AND org_id = ${orgId}
`;
    }

    const diff = await generateDiff(prev, updates);

    await sql`
        UPDATE sales
SET
quantity = COALESCE(${updates.quantity}, quantity),
    sale_price = COALESCE(${updates.sale_price}, sale_price),
    total_amount = COALESCE(${updates.total_amount}, total_amount),
    gst_amount = COALESCE(${updates.gst_amount}, gst_amount),
    profit = COALESCE(${updates.profit}, profit),
    payment_method = COALESCE(${updates.payment_method}, payment_method),
    updated_at = CURRENT_TIMESTAMP
        WHERE id = ${saleId} AND org_id = ${orgId}
`;

    // Re-sync daily report
    await syncDailyReport(new Date(prev.sale_date).toISOString().split('T')[0]);

    await audit("Updated Sale", "sale", saleId, diff, orgId);
    (revalidateTag as any)("inventory");
    (revalidateTag as any)("sales");
    revalidatePath("/dashboard/sales", "page");
}

export async function getProfiles() {
    return nextCache(
        async (): Promise<Profile[]> => {
            const data = await sql`SELECT * FROM profiles ORDER BY created_at DESC`;
            return data.map((p: any) => ({
                ...p,
                created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
                updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : String(p.updated_at),
            })) as Profile[];
        },
        ["profiles-list"],
        { tags: ["profiles"] }
    )();
}

export async function getPendingApprovalsCount() {
    return nextCache(
        async (): Promise<number> => {
            const result = await sql`SELECT COUNT(*) as count FROM profiles WHERE status = 'pending'`;
            return parseInt(result[0]?.count || "0");
        },
        ["pending-approvals-count"],
        { tags: ["profiles"], revalidate: 60 }
    )();
}

export async function getProfile(id: string) {
    return cache(async (id: string) => {
        return nextCache(
            async (id: string) => {
                const result = await sql`SELECT * FROM profiles WHERE id = ${id} `;
                if (result.length === 0) return null;
                const p = result[0] as any;
                return {
                    ...p,
                    created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
                    updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : String(p.updated_at),
                } as Profile;
            },
            [`profile - ${id} `],
            { tags: ["profiles", `profile - ${id} `] }
        )(id);
    })(id);
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
    const result = await sql`
        INSERT INTO profiles(id, email, name, role, status, biometric_required)
VALUES(${profile.id}, ${profile.email}, ${profile.name || ""}, ${profile.role}, ${profile.status}, ${profile.biometric_required || false})
        ON CONFLICT(id) DO UPDATE SET
email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    biometric_required = EXCLUDED.biometric_required,
    updated_at = CURRENT_TIMESTAMP
RETURNING *
    `;
    return result[0] as any;
}

export async function updateProfileBiometricStatus(id: string, required: boolean, adminId: string): Promise<void> {
    const target = await getProfile(id);
    await sql`
        UPDATE profiles 
        SET biometric_required = ${required}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
`;

    await createAuditLog({
        user_id: adminId,
        action: `Biometric Lock ${required ? 'Enabled' : 'Disabled'} `,
        entity_type: "user",
        entity_id: id,
        details: { target_email: target?.email }
    });
}

export async function updateUserStatus(userId: string, status: string, orgId?: string): Promise<void> {
    await authorize("Update User Status", "admin", orgId);

    await sql`UPDATE profiles SET status = ${status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
    await audit("Updated User Status", "profile", userId, { status }, orgId);
    revalidatePath("/home/admin", "page");
}

export async function updateUserRole(userId: string, role: string, orgId?: string): Promise<void> {
    await authorize("Update User Role", "admin", orgId);

    await sql`UPDATE profiles SET role = ${role}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
    await audit("Updated User Role", "profile", userId, { role }, orgId);
    revalidatePath("/home/admin", "page");
}

export async function getSystemSettings(orgId?: string) {
    if (!orgId) {
        // Fallback for global admin or unauthenticated contexts if any
        return {
            id: 'default',
            allow_staff_inventory: true,
            allow_staff_sales: true,
            allow_staff_reports: true,
            allow_staff_reports_entry_only: false,
            allow_staff_analytics: false,
            allow_staff_add_inventory: false,
            gst_enabled: true,
            gst_inclusive: false,
            updated_at: new Date().toISOString()
        } as SystemSettings;
    }

    return nextCache(
        async (): Promise<SystemSettings> => {
            const result = await sql`SELECT settings, updated_at FROM organizations WHERE id = ${orgId}`;
            if (result.length === 0 || !result[0].settings) {
                return {
                    id: orgId,
                    allow_staff_inventory: true,
                    allow_staff_sales: true,
                    allow_staff_reports: true,
                    allow_staff_reports_entry_only: false,
                    allow_staff_analytics: false,
                    allow_staff_add_inventory: false,
                    gst_enabled: true,
                    gst_inclusive: false,
                    updated_at: new Date().toISOString()
                } as SystemSettings;
            }
            const s = result[0].settings;
            return {
                id: orgId,
                ...s,
                updated_at: result[0].updated_at instanceof Date ? result[0].updated_at.toISOString() : String(result[0].updated_at),
            } as SystemSettings;
        },
        [`org-settings-${orgId}`],
        { tags: ["settings", `settings-${orgId}`], revalidate: 3600 }
    )();
}

export async function updateSystemSettings(updates: Partial<SystemSettings>, orgId: string): Promise<void> {
    await authorize("Update Settings", "admin", orgId);

    // In V3, settings are per-organization in JSONB
    await sql`
        UPDATE organizations
        SET settings = settings || ${JSON.stringify(updates)}::jsonb
        WHERE id = ${orgId}
    `;

    await audit("Updated Settings", "settings", orgId, updates, orgId);
    (revalidateTag as any)(`settings-${orgId}`);
    revalidatePath("/home/admin", "page");
}

export async function createAuditLog(log: Omit<AuditLog, "id" | "created_at" | "user_email">): Promise<void> {
    await sql`
        INSERT INTO audit_logs(user_id, action, entity_type, entity_id, details)
VALUES(${log.user_id}, ${log.action}, ${log.entity_type}, ${log.entity_id || null}, ${log.details ? JSON.stringify(log.details) : null})
    `;
}

export const getAuditLogs = nextCache(
    async (): Promise<AuditLog[]> => {
        const data = await sql`
            SELECT a.*, p.name as user_name, p.email as user_email
            FROM audit_logs a
            LEFT JOIN profiles p ON a.user_id = p.id
            ORDER BY a.created_at DESC
            LIMIT 100
    `;
        return data as AuditLog[];
    },
    ["audit-logs-list"],
    { revalidate: 60 } // Short revalidation for security logs
);

export const getDailyPulse = nextCache(
    async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [sales, topItems] = await Promise.all([
            sql`
SELECT
COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    SUM(profit) as total_profit,
    SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END) as cash_total,
    SUM(CASE WHEN payment_method = 'UPI' THEN total_amount ELSE 0 END) as upi_total
                FROM sales
                WHERE created_at >= ${today.toISOString()}
`,
            sql`
SELECT
i.name,
    SUM(s.quantity) as total_qty,
    SUM(s.total_amount) as total_amount
                FROM sales s
                JOIN inventory i ON s.inventory_id = i.id
                WHERE s.created_at >= ${today.toISOString()}
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
    ["daily-pulse"],
    { tags: ["sales"], revalidate: 300 } // Cache for 5 mins or until sale tag revalidated
);

export const getExecutiveAnalytics = nextCache(
    async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch all analytics data in parallel
        const [dailyTrends, itemDistribution, staffPerformance, stockSummary] = await Promise.all([
            sql`
SELECT
DATE(created_at) as date,
    SUM(total_amount) as revenue,
    SUM(profit) as profit
                FROM sales
                WHERE created_at >= ${thirtyDaysAgo.toISOString()}
                GROUP BY DATE(created_at)
                ORDER BY date ASC
    `,
            sql`
SELECT
i.name,
    SUM(s.total_amount) as value
                FROM sales s
                JOIN inventory i ON s.inventory_id = i.id
                WHERE s.created_at >= ${thirtyDaysAgo.toISOString()}
                GROUP BY i.name
                ORDER BY value DESC
                LIMIT 5
    `,
            sql`
SELECT
p.name as staff_name,
    p.email,
    COUNT(s.id) as total_sales,
    SUM(s.total_amount) as total_revenue
                FROM sales s
                JOIN profiles p ON s.user_id = p.id
                WHERE s.created_at >= ${thirtyDaysAgo.toISOString()}
                GROUP BY p.name, p.email
                ORDER BY total_revenue DESC
    `,
            sql`
SELECT
SUM(stock * buy_price) as total_inventory_value,
    COUNT(*) as total_skus,
    SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as low_stock_count
                FROM inventory
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
    ["executive-analytics"],
    { tags: ["sales", "inventory"], revalidate: 60 }
);

export async function getDailyReports(orgId: string) {
    return nextCache(
        async (): Promise<DailyReport[]> => {
            const data = await sql`SELECT * FROM daily_reports WHERE org_id = ${orgId} ORDER BY report_date DESC`;
            return data.map((d: any) => ({
                ...d,
                report_date: d.report_date instanceof Date ? d.report_date.toISOString().split('T')[0] : String(d.report_date),
                total_sale_gross: parseFloat(d.total_sale_gross),
                total_cost: parseFloat(d.total_cost),
                expenses: parseFloat(d.expenses),
                cash_sale: parseFloat(d.cash_sale),
                online_sale: parseFloat(d.online_sale),
                online_cost: parseFloat(d.online_cost),
                created_at: d.created_at instanceof Date ? d.created_at.toISOString() : String(d.created_at),
                updated_at: d.updated_at instanceof Date ? d.updated_at.toISOString() : String(d.updated_at),
            })) as DailyReport[];
        },
        [`daily-reports-list-${orgId}`],
        { tags: ["reports", `reports-${orgId}`], revalidate: 60 }
    )();
}

export async function addDailyReport(report: Omit<DailyReport, "id" | "created_at" | "updated_at">, orgId: string, userId?: string): Promise<DailyReport> {
    const result = await sql`
        INSERT INTO daily_reports(report_date, total_sale_gross, total_cost, expenses, cash_sale, online_sale, online_cost, expense_breakdown, org_id)
        VALUES(${report.report_date}, ${report.total_sale_gross}, ${report.total_cost}, ${report.expenses}, ${report.cash_sale}, ${report.online_sale}, ${report.online_cost}, ${JSON.stringify(report.expense_breakdown)}, ${orgId})
        ON CONFLICT(report_date, org_id) DO UPDATE SET
            total_sale_gross = EXCLUDED.total_sale_gross,
            total_cost = EXCLUDED.total_cost,
            expenses = EXCLUDED.expenses,
            cash_sale = EXCLUDED.cash_sale,
            online_sale = EXCLUDED.online_sale,
            online_cost = EXCLUDED.online_cost,
            expense_breakdown = EXCLUDED.expense_breakdown,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `;

    if (userId) {
        await createAuditLog({
            user_id: userId,
            action: "Updated Daily Report",
            entity_type: "daily_report",
            entity_id: result[0].id,
            details: { date: report.report_date }
        });
    }

    (revalidateTag as any)("reports");
    revalidatePath("/dashboard/reports", "page");

    const d = result[0];
    return {
        ...d,
        report_date: d.report_date instanceof Date ? d.report_date.toISOString().split('T')[0] : String(d.report_date),
        total_sale_gross: parseFloat(d.total_sale_gross),
        total_cost: parseFloat(d.total_cost),
        expenses: parseFloat(d.expenses),
        cash_sale: parseFloat(d.cash_sale),
        online_sale: parseFloat(d.online_sale),
        online_cost: parseFloat(d.online_cost),
    } as DailyReport;
}

export async function deleteDailyReport(id: string): Promise<void> {
    await sql`DELETE FROM daily_reports WHERE id = ${id} `;
    (revalidateTag as any)("reports");
    revalidatePath("/dashboard/reports", "page");
}

export async function syncDailyReport(date: string): Promise<void> {
    // 1. Check if there are any sales for this date
    // If NO sales exist, we should NOT overwrite the daily report, 
    // because the report might contain manual/OCR data that doesn't have granular sales records.
    const salesCheck = await sql`SELECT count(*) as count FROM sales WHERE sale_date = ${date} `;
    if (parseInt(salesCheck[0].count) === 0) {
        console.log(`[Sync] No sales found for ${date}.Skipping sync to preserve manual / OCR data.`);
        return;
    }

    // 2. Fetch sales aggregation for this date
    const salesAgg = await sql`
SELECT
SUM(total_amount) as total_gross,
    SUM(total_amount - profit) as total_cost_derived,
    SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END) as cash_total,
    SUM(CASE WHEN payment_method = 'UPI' THEN total_amount ELSE 0 END) as upi_total
        FROM sales
        WHERE sale_date = ${date}
`;

    const totalGross = parseFloat(salesAgg[0]?.total_gross || "0");
    const totalCost = parseFloat(salesAgg[0]?.total_cost_derived || "0");
    const cashTotal = parseFloat(salesAgg[0]?.cash_total || "0");
    const upiTotal = parseFloat(salesAgg[0]?.upi_total || "0");

    // 3. Update existing report or Create new
    const existing = await sql`SELECT * FROM daily_reports WHERE report_date = ${date} `;

    if (existing.length > 0) {
        // Update existing, preserving expenses and online_cost
        await sql`
            UPDATE daily_reports
SET
total_sale_gross = ${totalGross},
total_cost = ${totalCost},
cash_sale = ${cashTotal},
online_sale = ${upiTotal},
updated_at = CURRENT_TIMESTAMP
            WHERE report_date = ${date}
`;
    } else {
        // Create new
        await sql`
            INSERT INTO daily_reports(report_date, total_sale_gross, total_cost, cash_sale, online_sale, expenses, online_cost)
VALUES(${date}, ${totalGross}, ${totalCost}, ${cashTotal}, ${upiTotal}, 0, 0)
    `;
    }

    (revalidateTag as any)("reports");
    revalidatePath("/dashboard/reports", "page");
}

export const getSalesByDate = cache(async (date: string): Promise<(Sale & { inventory?: InventoryItem })[]> => {
    return nextCache(
        async (date: string) => {
            const data = await sql`
                SELECT s.*, i.name as inventory_name, i.sku as inventory_sku, i.buy_price as inventory_buy_price
                FROM sales s
                LEFT JOIN inventory i ON s.inventory_id = i.id
                WHERE s.sale_date = ${date}
                ORDER BY s.created_at DESC
            `;

            return data.map((row: any) => ({
                ...row,
                sale_price: parseFloat(row.sale_price),
                total_amount: parseFloat(row.total_amount),
                gst_amount: parseFloat(row.gst_amount),
                profit: parseFloat(row.profit),
                inventory: row.inventory_id ? {
                    id: row.inventory_id,
                    sku: row.inventory_sku,
                    name: row.inventory_name,
                    buy_price: parseFloat(row.inventory_buy_price),
                } : undefined
            })) as any;
        },
        [`sales - by - date - ${date} `],
        { tags: ["sales", `sales - ${date} `] }
    )(date);
});
// Expnese Categories
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
    revalidatePath("/home/reports", "page");

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
    revalidatePath("/home/reports", "page");
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

export async function getCustomers(orgId: string) {
    return nextCache(
        async (): Promise<Customer[]> => {
            const data = await sql`
                SELECT c.*, 
                       COALESCE(SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END), 0) as balance
                FROM customers c
                LEFT JOIN khata_transactions k ON c.id = k.customer_id
                WHERE c.org_id = ${orgId}
                GROUP BY c.id
                ORDER BY c.name ASC
            `;
            return data.map((c: any) => ({
                ...c,
                balance: parseFloat(c.balance || "0"),
                created_at: c.created_at instanceof Date ? c.created_at.toISOString() : String(c.created_at),
                updated_at: c.updated_at instanceof Date ? c.updated_at.toISOString() : String(c.updated_at),
            })) as Customer[];
        },
        [`customers-list-${orgId}`],
        { tags: ["customers", `customers-${orgId}`], revalidate: 300 }
    )();
}

export async function getCustomer(id: string, orgId: string): Promise<Customer | null> {
    const result = await sql`
        SELECT c.*, 
               COALESCE(SUM(CASE WHEN k.type = 'credit' THEN k.amount ELSE -k.amount END), 0) as balance
        FROM customers c
        LEFT JOIN khata_transactions k ON c.id = k.customer_id
        WHERE c.id = ${id} AND c.org_id = ${orgId}
        GROUP BY c.id
    `;
    if (result.length === 0) return null;
    const c = result[0] as any;
    return {
        ...c,
        balance: parseFloat(c.balance || "0"),
        created_at: c.created_at instanceof Date ? c.created_at.toISOString() : String(c.created_at),
        updated_at: c.updated_at instanceof Date ? c.updated_at.toISOString() : String(c.updated_at),
    } as Customer;
}

export async function addCustomer(customer: { name: string; phone: string; address?: string }, orgId: string): Promise<Customer> {
    await authorize("Add Customer", undefined, orgId);

    const result = await sql`
        INSERT INTO customers(name, phone, address, org_id)
        VALUES(${customer.name}, ${customer.phone}, ${customer.address || null}, ${orgId})
        RETURNING *
    `;

    const newCustomer = result[0] as Customer;
    await audit("Added Customer", "customer", newCustomer.id, { name: newCustomer.name, phone: newCustomer.phone }, orgId);

    (revalidateTag as any)(`customers-${orgId}`);
    revalidatePath("/home/customers", "page");
    return newCustomer;
}

export async function updateCustomer(id: string, orgId: string, updates: Partial<Customer>): Promise<void> {
    await authorize("Update Customer", undefined, orgId);

    await sql`
        UPDATE customers
        SET name = COALESCE(${updates.name}, name),
            phone = COALESCE(${updates.phone}, phone),
            address = COALESCE(${updates.address}, address),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND org_id = ${orgId}
    `;

    await audit("Updated Customer", "customer", id, updates, orgId);
    (revalidateTag as any)(`customers-${orgId}`);
    revalidatePath("/home/customers", "page");
}

export async function deleteCustomer(id: string, orgId: string): Promise<void> {
    await authorize("Delete Customer", "admin", orgId);

    await sql`DELETE FROM customers WHERE id = ${id} AND org_id = ${orgId}`;
    await audit("Deleted Customer", "customer", id, { id }, orgId);

    (revalidateTag as any)(`customers-${orgId}`);
    revalidatePath("/home/customers", "page");
}

// ============================================
// KHATA (CREDIT LEDGER)
// ============================================

export async function getKhataTransactions(orgId: string, customerId?: string): Promise<KhataTransaction[]> {
    const data = customerId
        ? await sql`
            SELECT k.*, c.name as customer_name, c.phone as customer_phone
            FROM khata_transactions k
            JOIN customers c ON k.customer_id = c.id
            WHERE k.customer_id = ${customerId} AND k.org_id = ${orgId}
            ORDER BY k.created_at DESC
        `
        : await sql`
            SELECT k.*, c.name as customer_name, c.phone as customer_phone
            FROM khata_transactions k
            JOIN customers c ON k.customer_id = c.id
            WHERE k.org_id = ${orgId}
            ORDER BY k.created_at DESC
            LIMIT 100
        `;

    return data.map((k: any) => ({
        ...k,
        amount: parseFloat(k.amount),
        created_at: k.created_at instanceof Date ? k.created_at.toISOString() : String(k.created_at),
        customer: { id: k.customer_id, name: k.customer_name, phone: k.customer_phone }
    })) as KhataTransaction[];
}

export async function addKhataTransaction(
    transaction: { customer_id: string; type: "credit" | "payment"; amount: number; note?: string; sale_id?: string },
    orgId: string
): Promise<KhataTransaction> {
    const user = await authorize("Add Khata Transaction", undefined, orgId);

    const result = await sql`
        INSERT INTO khata_transactions(customer_id, type, amount, note, sale_id, created_by, org_id)
        VALUES(${transaction.customer_id}, ${transaction.type}, ${transaction.amount}, ${transaction.note || null}, ${transaction.sale_id || null}, ${user.id}, ${orgId})
        RETURNING *
    `;

    await audit(`Khata ${transaction.type === 'credit' ? 'Credit' : 'Payment'}`, "khata_tx", result[0].id, {
        customer_id: transaction.customer_id,
        amount: transaction.amount,
        type: transaction.type
    }, orgId);

    (revalidateTag as any)(`customers-${orgId}`);
    revalidatePath("/home/customers", "page");
    return result[0] as any;
}

export async function getCustomerBalance(customerId: string, orgId: string): Promise<number> {
    const result = await sql`
        SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance
        FROM khata_transactions
        WHERE customer_id = ${customerId} AND org_id = ${orgId}
    `;
    return parseFloat(result[0]?.balance || "0");
}

// ============================================
// ORGANIZATION MANAGEMENT
// ============================================

export async function createOrganization(name: string, userId: string, details?: { gstin?: string; address?: string; phone?: string }): Promise<Organization> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

    const result = await sql`
        INSERT INTO organizations(name, slug, created_by, gstin, address, phone)
        VALUES(${name}, ${uniqueSlug}, ${userId}, ${details?.gstin || null}, ${details?.address || null}, ${details?.phone || null})
        RETURNING *
    `;

    // Add creator as admin
    await sql`
        INSERT INTO organization_members(org_id, user_id, role)
        VALUES(${result[0].id}, ${userId}, 'admin')
    `;

    return result[0] as any;
}

export async function getUserOrganizations(userId: string): Promise<(OrganizationMember & { organization: Organization })[]> {
    const data = await sql`
        SELECT om.*, 
               o.name as org_name, o.slug as org_slug, o.created_by, o.created_at as org_created_at,
               o.gstin, o.address, o.phone, o.logo_url, o.settings
        FROM organization_members om
        JOIN organizations o ON om.org_id = o.id
        WHERE om.user_id = ${userId}
        ORDER BY o.created_at DESC
    `;

    return data.map((row: any) => ({
        id: row.id,
        org_id: row.org_id,
        user_id: row.user_id,
        role: row.role,
        created_at: row.created_at,
        organization: {
            id: row.org_id,
            name: row.org_name,
            slug: row.org_slug,
            gstin: row.gstin,
            address: row.address,
            phone: row.phone,
            logo_url: row.logo_url,
            settings: row.settings,
            created_by: row.created_by,
            created_at: row.org_created_at
        }
    })) as any;
}

export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    await authorize("Update Organization", "admin", orgId);

    await sql`
        UPDATE organizations
        SET
            name = COALESCE(${updates.name}, name),
            gstin = COALESCE(${updates.gstin}, gstin),
            address = COALESCE(${updates.address}, address),
            phone = COALESCE(${updates.phone}, phone),
            logo_url = COALESCE(${updates.logo_url}, logo_url),
            settings = COALESCE(${updates.settings ? JSON.stringify(updates.settings) : null}::jsonb, settings)
        WHERE id = ${orgId}
    `;

    await audit("Updated Organization", "organization", orgId, updates, orgId);
    (revalidateTag as any)(`org-${orgId}`);
    (revalidateTag as any)(`org-slug-${updates.slug || 'default'}`);
    revalidatePath("/home/admin", "page");
}

export const getOrganizationBySlug = cache(async (slug: string): Promise<Organization | null> => {
    return nextCache(
        async (): Promise<Organization | null> => {
            const result = await sql`SELECT * FROM organizations WHERE slug = ${slug}`;
            return result.length > 0 ? result[0] as any : null;
        },
        [`org-slug-${slug}`],
        { tags: [`org-slug-${slug}`], revalidate: 3600 }
    )();
});

export async function getOrganization(orgId: string): Promise<Organization | null> {
    const result = await sql`SELECT * FROM organizations WHERE id = ${orgId}`;
    return result.length > 0 ? result[0] as any : null;
}

export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    const data = await sql`
        SELECT om.*, p.name as user_name, p.email as user_email
        FROM organization_members om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.org_id = ${orgId}
        ORDER BY om.role ASC, p.name ASC
    `;

    return data.map((row: any) => ({
        id: row.id,
        org_id: row.org_id,
        user_id: row.user_id,
        role: row.role,
        created_at: row.created_at,
        user: { id: row.user_id, name: row.user_name, email: row.user_email }
    })) as any;
}

export async function createInvite(orgId: string, email: string, role: string): Promise<OrganizationInvite> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await sql`
        INSERT INTO organization_invites(org_id, email, role, token, expires_at)
        VALUES(${orgId}, ${email}, ${role}, ${token}, ${expiresAt.toISOString()})
        RETURNING *
    `;

    return result[0] as any;
}

export async function getInviteByToken(token: string): Promise<OrganizationInvite | null> {
    const result = await sql`
        SELECT * FROM organization_invites 
        WHERE token = ${token} AND expires_at > NOW() AND accepted_at IS NULL
    `;
    return result.length > 0 ? result[0] as any : null;
}

export async function acceptInvite(token: string, userId: string): Promise<boolean> {
    const invite = await getInviteByToken(token);
    if (!invite) return false;

    // Add user to org
    await sql`
        INSERT INTO organization_members(org_id, user_id, role)
        VALUES(${invite.org_id}, ${userId}, ${invite.role})
        ON CONFLICT(org_id, user_id) DO UPDATE SET role = EXCLUDED.role
    `;

    // Mark invite as accepted
    await sql`UPDATE organization_invites SET accepted_at = NOW() WHERE id = ${invite.id}`;

    return true;
}

export async function updateMemberRole(orgId: string, userId: string, newRole: string): Promise<void> {
    await sql`
        UPDATE organization_members
        SET role = ${newRole}
        WHERE org_id = ${orgId} AND user_id = ${userId}
    `;
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
    await sql`DELETE FROM organization_members WHERE org_id = ${orgId} AND user_id = ${userId}`;
}

export async function getCurrentOrgId(userId: string): Promise<string | null> {
    const orgs = await getUserOrganizations(userId);
    return orgs[0]?.org_id || null;
}

// ============================================
// SUPPLIER MANAGEMENT
// ============================================

export async function getSuppliers(orgId: string) {
    return nextCache(
        async (): Promise<Supplier[]> => {
            const data = await sql`
                SELECT s.*, 
                       COALESCE(SUM(CASE WHEN st.type = 'purchase' THEN st.amount ELSE -st.amount END), 0) as balance
                FROM suppliers s
                LEFT JOIN supplier_transactions st ON s.id = st.supplier_id
                WHERE s.org_id = ${orgId}
                GROUP BY s.id
                ORDER BY s.name ASC
            `;
            return data.map((s: any) => ({
                ...s,
                balance: parseFloat(s.balance || "0"),
                created_at: s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at),
                updated_at: s.updated_at instanceof Date ? s.updated_at.toISOString() : String(s.updated_at),
            })) as Supplier[];
        },
        [`suppliers-list-${orgId}`],
        { tags: ["suppliers", `suppliers-${orgId}`], revalidate: 300 }
    )();
}

export async function getSupplier(id: string, orgId: string): Promise<Supplier | null> {
    const result = await sql`
        SELECT s.*, 
               COALESCE(SUM(CASE WHEN st.type = 'purchase' THEN st.amount ELSE -st.amount END), 0) as balance
        FROM suppliers s
        LEFT JOIN supplier_transactions st ON s.id = st.supplier_id
        WHERE s.id = ${id} AND s.org_id = ${orgId}
        GROUP BY s.id
    `;
    if (result.length === 0) return null;
    const s = result[0] as any;
    return {
        ...s,
        balance: parseFloat(s.balance || "0"),
        created_at: s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at),
        updated_at: s.updated_at instanceof Date ? s.updated_at.toISOString() : String(s.updated_at),
    } as Supplier;
}

export async function addSupplier(supplier: { name: string; phone?: string; address?: string; gstin?: string }, orgId: string): Promise<Supplier> {
    await authorize("Add Supplier", "admin", orgId);

    const result = await sql`
        INSERT INTO suppliers(name, phone, address, gstin, org_id)
        VALUES(${supplier.name}, ${supplier.phone || null}, ${supplier.address || null}, ${supplier.gstin || null}, ${orgId})
        RETURNING *
    `;

    const newSupplier = result[0] as Supplier;
    await audit("Added Supplier", "supplier", newSupplier.id, { name: newSupplier.name }, orgId);

    (revalidateTag as any)(`suppliers-${orgId}`);
    return newSupplier;
}

// ============================================
// SUPPLIER TRANSACTIONS (PURCHASE LEDGER)
// ============================================

export async function getSupplierTransactions(orgId: string, supplierId?: string): Promise<SupplierTransaction[]> {
    const data = supplierId
        ? await sql`
            SELECT st.*, s.name as supplier_name, s.phone as supplier_phone
            FROM supplier_transactions st
            JOIN suppliers s ON st.supplier_id = s.id
            WHERE st.supplier_id = ${supplierId} AND st.org_id = ${orgId}
            ORDER BY st.created_at DESC
        `
        : await sql`
            SELECT st.*, s.name as supplier_name, s.phone as supplier_phone
            FROM supplier_transactions st
            JOIN suppliers s ON st.supplier_id = s.id
            WHERE st.org_id = ${orgId}
            ORDER BY st.created_at DESC
            LIMIT 100
        `;

    return data.map((t: any) => ({
        ...t,
        amount: parseFloat(t.amount),
        created_at: t.created_at instanceof Date ? t.created_at.toISOString() : String(t.created_at),
        supplier: { id: t.supplier_id, name: t.supplier_name, phone: t.supplier_phone }
    })) as SupplierTransaction[];
}

export async function addSupplierTransaction(
    transaction: { supplier_id: string; type: "purchase" | "payment"; amount: number; note?: string },
    orgId: string
): Promise<SupplierTransaction> {
    const user = await authorize("Add Supplier Transaction", undefined, orgId);

    const result = await sql`
        INSERT INTO supplier_transactions(supplier_id, type, amount, note, created_by, org_id)
        VALUES(${transaction.supplier_id}, ${transaction.type}, ${transaction.amount}, ${transaction.note || null}, ${user.id}, ${orgId})
        RETURNING *
    `;

    await audit(`Supplier ${transaction.type === 'purchase' ? 'Purchase' : 'Payment'}`, "supplier_tx", result[0].id, {
        supplier_id: transaction.supplier_id,
        amount: transaction.amount,
        type: transaction.type
    }, orgId);

    (revalidateTag as any)(`suppliers-${orgId}`);
    return result[0] as any;
}
