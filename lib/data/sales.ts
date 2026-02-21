"use server"

import { sql } from "../db";
import type { Sale, InventoryItem, AuditLog, Organization } from "../types";
import { logHealthMetric } from "../monitoring";
import { SaleSchema, BatchSalesSchema, ReturnSchema } from "../validation";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { cache } from "react";
import { authorize, audit, generateDiff } from "../security";
import { triggerSync } from "../sync-notifier";
import { syncDailyReport } from "./reports";
import { getCurrentOrgId } from "./auth";

function resolveInitialPaymentStatus(
    paymentMethod: Sale["payment_method"],
    requestedStatus?: Sale["payment_status"]
): "pending" | "paid" {
    if (paymentMethod === "Credit") return "pending";
    if (paymentMethod === "UPI" && requestedStatus === "pending") return "pending";
    return "paid";
}

export async function getSales(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async (): Promise<(Sale & { inventory?: InventoryItem })[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const start = Date.now();
            const data = await db`
                SELECT s.*, i.name as inventory_name, i.sku as inventory_sku, i.buy_price as inventory_buy_price
                FROM sales s
                LEFT JOIN inventory i ON s.inventory_id = i.id
                WHERE s.org_id = ${orgId}
                ORDER BY s.created_at DESC
            `;
            await logHealthMetric(Date.now() - start, "getSales", db);

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
        [`sales - list - ${flavor} -${orgId} `],
        { tags: ["sales", `sales - ${orgId} `, `sales - ${flavor} `], revalidate: 3600 }
    )();
}

export async function recordSale(sale: Omit<Sale, "id" | "user_id" | "profit" | "created_at">, orgId: string): Promise<Sale> {
    const validation = SaleSchema.safeParse(sale);
    if (!validation.success) {
        throw new Error(`Invalid Sale Data: ${validation.error.message}`);
    }

    const user = await authorize("Record Sale", undefined, orgId);

    // Get product to calculate cost and profit
    const productResult = await sql`SELECT name, buy_price, stock FROM inventory WHERE id = ${sale.inventory_id} AND org_id = ${orgId} `;
    if (productResult.length === 0) {
        throw new Error("Inventory item not found");
    }
    const product = productResult[0];

    if (product.stock < sale.quantity) {
        throw new Error(`Insufficient stock.Available: ${product.stock} `);
    }

    const profit = (sale.sale_price - parseFloat(product.buy_price)) * sale.quantity;

    const taxableAmount = sale.total_amount - sale.gst_amount;

    // Simple logic for Intra-state (CGST/SGST) vs Inter-state (IGST)
    // For now, assuming intra-state as we don't have buyer state yet.
    const cgst = sale.gst_amount / 2;
    const sgst = sale.gst_amount / 2;
    const initialPaymentStatus = resolveInitialPaymentStatus(sale.payment_method, sale.payment_status);

    const result = await sql`
        INSERT INTO sales(
            inventory_id, user_id, org_id, quantity, sale_price, 
            total_amount, gst_amount, profit, payment_method, 
            batch_id, sale_date, taxable_amount, cgst_amount, sgst_amount,
            hsn_code, customer_gstin, customer_name, customer_phone, payment_status
        )
        VALUES(
            ${sale.inventory_id}, ${user.id}, ${orgId}, ${sale.quantity}, ${sale.sale_price}, 
            ${sale.total_amount}, ${sale.gst_amount}, ${profit}, ${sale.payment_method}, 
            ${sale.batch_id || null}, ${sale.sale_date}, ${taxableAmount}, ${cgst}, ${sgst},
            ${sale.hsn_code || null}, ${sale.customer_gstin || null}, 
            ${sale.customer_name || null}, ${sale.customer_phone || null}, ${initialPaymentStatus}
        )
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

    revalidatePath("/dashboard", "page");
    revalidatePath("/dashboard/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory - ${orgId} `);
    triggerSync(orgId, 'sale');

    return {
        ...finalSale,
        sale_price: parseFloat(finalSale.sale_price as any),
        total_amount: parseFloat(finalSale.total_amount as any),
        gst_amount: parseFloat(finalSale.gst_amount as any),
        profit: parseFloat(finalSale.profit as any),
    };
}

export async function recordBatchSales(sales: Omit<Sale, "id" | "user_id" | "sale_date" | "created_at">[], orgId: string): Promise<Sale[]> {
    // 1. Validate Input Structure
    const validation = BatchSalesSchema.safeParse(sales);
    if (!validation.success) {
        throw new Error(`Invalid Sales Data: ${validation.error.message} `);
    }

    // 2. Authorize
    const user = await authorize("Record Batch Sales", undefined, orgId);
    const batchId = crypto.randomUUID();

    const { getDemoSql, getProductionSql } = await import("../db");
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const db = isGuest ? getDemoSql() : getProductionSql();

    // Prepare atomic transaction queries
    const queries: any[] = [];

    // Credit Sync: If this is a credit sale, we need a customer record
    let khataCustomerId: string | null = null;
    if (sales.length > 0 && sales[0].payment_method === 'Credit' && sales[0].customer_phone) {
        const { getOrCreateCustomerByPhone } = await import("./customers");
        const customer = await getOrCreateCustomerByPhone(
            sales[0].customer_name || "Unknown",
            sales[0].customer_phone,
            orgId
        );
        khataCustomerId = customer.id;

        // Add Khata Transaction query
        // Note: khata_transactions uses normal SQL insert, so we can't easily batch it with Neon 
        // unless we use a SQL statement here.
        queries.push(db`
            INSERT INTO khata_transactions(customer_id, type, amount, note, sale_id, created_by, org_id)
            VALUES(
                ${khataCustomerId}, 
                'credit', 
                ${sales.reduce((sum, s) => sum + s.total_amount, 0)}, 
                ${`Sale Batch: ${batchId}`}, 
                ${batchId}, 
                ${user.id}, 
                ${orgId}
            )
        `);
    }

    // We need to fetch current prices/stock inside the transaction context?
    // Neon transaction batch doesn't allow read-then-write logic across steps.
    // We must use "INSERT ... SELECT" and "UPDATE ... WHERE" logic to carry data.

    for (const sale of sales) {
        const paymentStatus = resolveInitialPaymentStatus(sale.payment_method, sale.payment_status);

        // Query 1: Deduct Stock (Abort if insufficient)
        // We use a PL/pgSQL block to raise exception if stock is low
        queries.push(db`
            DO $$
BEGIN
                UPDATE inventory 
                SET stock = stock - ${sale.quantity} 
                WHERE id = ${sale.inventory_id} AND org_id = ${orgId} AND stock >= ${sale.quantity};
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Insufficient stock for item %', ${sale.inventory_id};
                END IF;
            END $$;
`);

        // Query 2: Insert Sale (calculating profit on the fly from inventory)
        queries.push(db`
            INSERT INTO sales(
                inventory_id, user_id, org_id, quantity, sale_price,
                total_amount, gst_amount, profit, payment_method,
                batch_id, customer_gstin, hsn_code,
                taxable_amount, cgst_amount, sgst_amount,
                customer_name, customer_phone, payment_status
            )
            SELECT 
                ${sale.inventory_id}, ${user.id}, ${orgId}, ${sale.quantity}, ${sale.sale_price}, 
                ${sale.total_amount}, ${sale.gst_amount},
                (${sale.sale_price} - buy_price) * ${sale.quantity}, 
                ${sale.payment_method}, ${batchId}, ${sale.customer_gstin || null},
                COALESCE(${sale.hsn_code || null}, hsn_code),
                ${sale.total_amount - sale.gst_amount},
                ${sale.gst_amount / 2},
                ${sale.gst_amount / 2},
                ${sale.customer_name || null}, ${sale.customer_phone || null},
                ${paymentStatus}
            FROM inventory
            WHERE id = ${sale.inventory_id} AND org_id = ${orgId}
        `);
    }

    // Execute Atomically
    try {
        await db.transaction(queries);
    } catch (error) {
        throw new Error(`Batch Transaction Failed: ${error} `);
    }

    await audit("Recorded Batch Sales", "sale", batchId, { count: sales.length, org_id: orgId }, orgId);

    revalidatePath("/dashboard", "page");
    revalidatePath("/dashboard/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory - ${orgId} `);
    triggerSync(orgId, 'sale');

    // Return empty array or fetch inserted sales? 
    // Since transaction doesn't return rows easily in this batch mode without more queries, we return basic confirmation.
    // The original code returned objects. We'll return partials.
    return sales.map(s => ({ ...s, batch_id: batchId } as any));
}

export async function processReturn(
    data: {
        original_sale_id: string;
        inventory_id: string;
        quantity: number;
        refund_amount: number;
        reason: string
    },
    orgId?: string
): Promise<void> {
    const validation = ReturnSchema.safeParse(data);
    if (!validation.success) {
        throw new Error(`Invalid Return Data: ${validation.error.message}`);
    }

    const saleId = data.original_sale_id;
    const quantity = data.quantity;
    const actualOrgId = orgId || await getCurrentOrgId();
    if (!actualOrgId) throw new Error("Organization ID required");

    await authorize("Process Return", undefined, actualOrgId);

    const saleResult = await sql`SELECT * FROM sales WHERE id = ${saleId} AND org_id = ${actualOrgId} `;
    if (saleResult.length === 0) {
        throw new Error("Sale not found");
    }
    const sale = saleResult[0];

    if (sale.quantity < quantity) {
        throw new Error("Return quantity exceeds sale quantity");
    }

    // NUCLEAR: Immutability Enforcement
    // We do NOT delete or update the original sale. We create a contra-entry (Refund/Return).

    // Calculate negative values
    const negQuantity = -quantity;
    const negTotal = -(sale.total_amount / sale.quantity * quantity);
    const negGst = -(sale.gst_amount / sale.quantity * quantity);
    const negProfit = -(sale.profit / sale.quantity * quantity);

    const { getDemoSql, getProductionSql } = await import("../db");
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const db = isGuest ? getDemoSql() : getProductionSql();

    const queries: any[] = [];

    // Query 1: Insert Return Record
    queries.push(db`
        INSERT INTO sales(
    inventory_id, user_id, org_id,
    quantity, sale_price, total_amount, gst_amount, profit,
    payment_method, batch_id, sale_date,
    is_return, original_sale_id
)
VALUES(
    ${sale.inventory_id}, ${sale.user_id}, ${actualOrgId},
    ${negQuantity}, ${sale.sale_price}, ${negTotal}, ${negGst}, ${negProfit},
    ${sale.payment_method}, ${sale.batch_id}, ${new Date().toISOString()},
    true, ${saleId}
)
    `);

    // Query 2: Return stock to inventory
    // We use a transaction-like update to ensure we don't proceed if inventory is gone (unlikely for return)
    queries.push(db`UPDATE inventory SET stock = stock + ${quantity} WHERE id = ${sale.inventory_id} AND org_id = ${actualOrgId} `);

    // Execute Atomically
    try {
        await db.transaction(queries);
    } catch (error) {
        throw new Error(`Process Return Transaction Failed: ${error} `);
    }

    await audit("Processed Return (Immutable)", "sale", saleId, { quantity, refund: data.refund_amount }, actualOrgId);
    revalidatePath("/dashboard/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory - ${actualOrgId} `);
    triggerSync(actualOrgId, 'sale');
}

export async function updateSale(saleId: string, updates: Partial<Sale>, orgId?: string): Promise<void> {
    const prevResult = await sql`SELECT * FROM sales WHERE id = ${saleId} `;
    if (prevResult.length === 0) {
        throw new Error("Sale not found");
    }
    const prev = prevResult[0];
    const actualOrgId = orgId || prev.org_id;

    await authorize("Update Sale", undefined, actualOrgId);

    const updateKeys = Object.keys(updates).filter((k) => (updates as any)[k] !== undefined);
    if (updateKeys.length === 0) {
        return;
    }

    const onlyPaymentStatusUpdate = updateKeys.every((k) => k === "payment_status");

    if (updates.payment_status && !["pending", "paid", "failed"].includes(updates.payment_status)) {
        throw new Error("Invalid payment status");
    }

    // Validate 5-minute window for inventory/amount edits only.
    if (!onlyPaymentStatusUpdate) {
        const diffMs = Date.now() - new Date(prev.created_at).getTime();
        if (diffMs > 5 * 60 * 1000) {
            throw new Error("Sale is locked (5-minute edit window expired)");
        }
    }

    // Adjust Inventory Stock before updating sale
    if (!onlyPaymentStatusUpdate && updates.quantity !== undefined && updates.quantity !== prev.quantity) {
        const diffQty = updates.quantity - prev.quantity;
        await sql`
            UPDATE inventory 
            SET stock = stock - ${diffQty}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${prev.inventory_id} AND org_id = ${actualOrgId}
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
    payment_status = COALESCE(${updates.payment_status}, payment_status),
    updated_at = CURRENT_TIMESTAMP
        WHERE id = ${saleId} AND org_id = ${actualOrgId}
`;

    // Re-sync daily report only when financial values changed.
    if (!onlyPaymentStatusUpdate) {
        await syncDailyReport(new Date(prev.sale_date).toISOString().split('T')[0]);
    }

    await audit(onlyPaymentStatusUpdate ? "Updated Sale Payment Status" : "Updated Sale", "sale", saleId, diff, actualOrgId);
    (revalidateTag as any)("inventory");
    (revalidateTag as any)("sales");
    revalidatePath("/dashboard/sales", "page");
    triggerSync(actualOrgId, 'sale');
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
