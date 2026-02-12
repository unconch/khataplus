"use server"

import { sql } from "../db";
import type { InventoryItem } from "../types";
import { logHealthMetric } from "../monitoring";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { authorize, audit } from "../security";
import { triggerSync } from "../sync-notifier";

export async function getInventory(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async (): Promise<InventoryItem[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const start = Date.now();
            const data = await db`SELECT * FROM inventory WHERE org_id = ${orgId} ORDER BY name ASC`;
            await logHealthMetric(Date.now() - start, "getInventory");

            return data.map((item: any) => ({
                ...item,
                buy_price: parseFloat(item.buy_price),
                gst_percentage: parseFloat(item.gst_percentage),
                min_stock: item.min_stock || 5
            })) as InventoryItem[];
        },
        [`inventory-list-${flavor}-${orgId}`],
        { tags: ["inventory", `inventory-${orgId}`, `inventory-${flavor}`], revalidate: 3600 }
    )();
}

export async function addInventoryItem(item: Omit<InventoryItem, "id" | "created_at" | "updated_at">, orgId?: string): Promise<InventoryItem> {
    const { getCurrentOrgId } = await import("./auth");
    const actualOrgId = orgId || await getCurrentOrgId();
    if (!actualOrgId) throw new Error("Organization ID required");

    await authorize("Add Inventory", "admin", actualOrgId);

    const result = await sql`
        INSERT INTO inventory(sku, name, buy_price, gst_percentage, stock, min_stock, org_id)
        VALUES(${item.sku}, ${item.name}, ${item.buy_price}, ${item.gst_percentage}, ${item.stock}, ${item.min_stock || 5}, ${actualOrgId})
        RETURNING *
    `;
    const newItem = result[0] as any;
    const inventory = {
        ...newItem,
        buy_price: parseFloat(newItem.buy_price),
        gst_percentage: parseFloat(newItem.gst_percentage),
    } as InventoryItem;

    await audit("Added Inventory", "inventory", inventory.id, { name: inventory.name, sku: inventory.sku, stock: inventory.stock }, actualOrgId);
    revalidatePath("/dashboard/inventory", "page");
    triggerSync(actualOrgId, 'inventory');

    return inventory;
}

export async function updateInventoryStock(id: string, newStock: number, orgId: string): Promise<void> {
    await authorize("Update Stock", undefined, orgId);

    const prevResult = await sql`SELECT name, stock FROM inventory WHERE id = ${id} AND org_id = ${orgId}`;
    if (prevResult.length === 0) {
        throw new Error("Item not found");
    }
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
    revalidatePath("/dashboard/inventory", "page");
    triggerSync(orgId, 'inventory');
}

export async function getLowStockItems(orgId: string): Promise<InventoryItem[]> {
    return nextCache(
        async (): Promise<InventoryItem[]> => {
            // Fetch items where stock is less than or equal to min_stock
            const data = await sql`
                SELECT * FROM inventory 
                WHERE org_id = ${orgId} 
                AND stock <= min_stock 
                ORDER BY stock ASC
            `;

            return data.map((item: any) => ({
                ...item,
                buy_price: parseFloat(item.buy_price),
                gst_percentage: parseFloat(item.gst_percentage),
                min_stock: item.min_stock || 5
            })) as InventoryItem[];
        },
        [`inventory-low-stock-${orgId}`],
        { tags: ["inventory", `inventory-${orgId}`, "low-stock"], revalidate: 600 }
    )();
}
