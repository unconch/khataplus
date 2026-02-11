"use server"

import { sql } from "../db";
import type { Sale, InventoryItem } from "../types";
import { logHealthMetric } from "../monitoring";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { cache } from "react";
import { authorize, audit, generateDiff } from "../security";
import { triggerSync } from "../sync-notifier";
import { syncDailyReport } from "./reports";
import { getCurrentOrgId } from "./auth";

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
    if (productResult.length === 0) {
        throw new Error("Inventory item not found");
    }
    const product = productResult[0];

    if (product.stock < sale.quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock} `);
    }

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

    revalidatePath("/dashboard", "page");
    revalidatePath("/dashboard/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory-${orgId}`);
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
    const user = await authorize("Record Batch Sales", undefined, orgId);
    const batchId = crypto.randomUUID();

    const results = await Promise.all(sales.map(async (sale) => {
        // Get product to calculate profit and fetch HSN
        const productResult = await sql`SELECT name, buy_price, stock, hsn_code FROM inventory WHERE id = ${sale.inventory_id} AND org_id = ${orgId} `;
        if (productResult.length === 0) {
            throw new Error(`Item ${sale.inventory_id} not found`);
        }
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

    revalidatePath("/dashboard", "page");
    revalidatePath("/dashboard/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory-${orgId}`);
    triggerSync(orgId, 'sale');

    return results.map((s: any) => ({
        ...s,
        sale_price: parseFloat(s.sale_price),
        total_amount: parseFloat(s.total_amount),
        gst_amount: parseFloat(s.gst_amount),
        profit: parseFloat(s.profit),
    })) as Sale[];
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
    const saleId = data.original_sale_id;
    const quantity = data.quantity;
    const actualOrgId = orgId || await getCurrentOrgId();
    if (!actualOrgId) throw new Error("Organization ID required");

    await authorize("Process Return", undefined, actualOrgId);

    const saleResult = await sql`SELECT * FROM sales WHERE id = ${saleId} AND org_id = ${actualOrgId}`;
    if (saleResult.length === 0) {
        throw new Error("Sale not found");
    }
    const sale = saleResult[0];

    if (sale.quantity < quantity) {
        throw new Error("Return quantity exceeds sale quantity");
    }

    // Update sale or delete if fully returned
    if (sale.quantity === quantity) {
        await sql`DELETE FROM sales WHERE id = ${saleId} AND org_id = ${actualOrgId}`;
    } else {
        await sql`
            UPDATE sales 
            SET quantity = quantity - ${quantity}, 
                total_amount = total_amount - (total_amount / quantity * ${quantity}),
                gst_amount = gst_amount - (gst_amount / quantity * ${quantity}),
                profit = profit - (profit / quantity * ${quantity}),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${saleId} AND org_id = ${actualOrgId}
        `;
    }

    // Return stock to inventory
    await sql`UPDATE inventory SET stock = stock + ${quantity} WHERE id = ${sale.inventory_id} AND org_id = ${actualOrgId}`;

    await audit("Processed Return", "sale", saleId, { quantity }, actualOrgId);
    revalidatePath("/dashboard/sales", "page");
    (revalidateTag as any)("sales");
    (revalidateTag as any)(`inventory-${actualOrgId}`);
    triggerSync(actualOrgId, 'sale');
}

export async function updateSale(saleId: string, updates: Partial<Sale>, orgId?: string): Promise<void> {
    const prevResult = await sql`SELECT * FROM sales WHERE id = ${saleId}`;
    if (prevResult.length === 0) {
        throw new Error("Sale not found");
    }
    const prev = prevResult[0];
    const actualOrgId = orgId || prev.org_id;

    await authorize("Update Sale", undefined, actualOrgId);

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
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${saleId} AND org_id = ${actualOrgId}
    `;

    // Re-sync daily report
    await syncDailyReport(new Date(prev.sale_date).toISOString().split('T')[0]);

    await audit("Updated Sale", "sale", saleId, diff, actualOrgId);
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
        [`sales-by-date-${date}`],
        { tags: ["sales", `sales-${date}`] }
    )(date);
});
