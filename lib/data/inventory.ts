"use server"

import { sql } from "../db";
import type { InventoryItem } from "../types";
import { logHealthMetric } from "../monitoring";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { authorize, audit } from "../security";
import { triggerSync } from "../sync-notifier";
import { recordStockMovement } from "./stock-movements";
import { getInventoryItemLimit } from "../billing-plans";

export async function getInventory(orgId: string, options: { limit?: number; offset?: number } = { limit: 1000 }) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";
    const limit = options.limit ?? 1000;
    const offset = options.offset ?? 0;

    return nextCache(
        async (): Promise<InventoryItem[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const start = Date.now();
            const data = await db`
                SELECT * FROM inventory 
                WHERE org_id = ${orgId} 
                ORDER BY name ASC
                LIMIT ${limit}
                OFFSET ${offset}
            `;
            await logHealthMetric(Date.now() - start, "getInventory", db);

            return data.map((item: any) => ({
                ...item,
                buy_price: parseFloat(item.buy_price),
                sell_price: item.sell_price === null || item.sell_price === undefined ? undefined : parseFloat(item.sell_price),
                gst_percentage: parseFloat(item.gst_percentage),
                min_stock: item.min_stock || 5
            })) as InventoryItem[];
        },
        [`inventory-list-${flavor}-${orgId}-${limit}-${offset}`],
        { tags: ["inventory", `inventory-${orgId}`, `inventory-${flavor}`], revalidate: 3600 }
    )();
}

export async function getInventoryItem(id: string, orgId: string): Promise<InventoryItem | null> {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const { getDemoSql, getProductionSql } = await import("../db");
    const db = isGuest ? getDemoSql() : getProductionSql();

    const rows = await db`
        SELECT * FROM inventory
        WHERE id = ${id} AND org_id = ${orgId}
        LIMIT 1
    `;

    if (rows.length === 0) return null;

    const item = rows[0] as any;
    return {
        ...item,
        buy_price: parseFloat(item.buy_price),
        sell_price: item.sell_price === null || item.sell_price === undefined ? undefined : parseFloat(item.sell_price),
        gst_percentage: parseFloat(item.gst_percentage),
        min_stock: item.min_stock || 5
    } as InventoryItem;
}

export async function addInventoryItem(item: Omit<InventoryItem, "id" | "created_at" | "updated_at">, orgId?: string): Promise<InventoryItem> {
    const { getCurrentOrgId } = await import("./auth");
    const actualOrgId = orgId || await getCurrentOrgId();
    if (!actualOrgId) throw new Error("Organization ID required");

    await authorize("Add Inventory", "admin", actualOrgId);

    const orgRows = await sql`SELECT plan_type FROM organizations WHERE id = ${actualOrgId} LIMIT 1`;
    const itemLimit = getInventoryItemLimit(orgRows[0]?.plan_type);
    if (itemLimit !== null) {
        const countRows = await sql`
            SELECT COUNT(*)::int AS count
            FROM inventory
            WHERE org_id = ${actualOrgId}
        `;
        const currentCount = Number(countRows[0]?.count || 0);
        if (currentCount >= itemLimit) {
            throw new Error(`Inventory item limit reached (${itemLimit}) for current plan. Upgrade to add more items.`);
        }
    }

    const result = await sql`
        INSERT INTO inventory(sku, name, buy_price, sell_price, gst_percentage, stock, min_stock, org_id)
        VALUES(${item.sku}, ${item.name}, ${item.buy_price}, ${item.sell_price ?? null}, ${item.gst_percentage}, ${item.stock}, ${item.min_stock || 5}, ${actualOrgId})
        RETURNING *
    `;
    const newItem = result[0] as any;
    const inventory = {
        ...newItem,
        buy_price: parseFloat(newItem.buy_price),
        sell_price: newItem.sell_price === null || newItem.sell_price === undefined ? undefined : parseFloat(newItem.sell_price),
        gst_percentage: parseFloat(newItem.gst_percentage),
    } as InventoryItem;

    await audit("Added Inventory", "inventory", inventory.id, { name: inventory.name, sku: inventory.sku, stock: inventory.stock }, actualOrgId);
    if ((inventory.stock || 0) > 0) {
        await recordStockMovement({
            orgId: actualOrgId,
            inventoryId: inventory.id,
            quantityDelta: Math.abs(inventory.stock || 0),
            movementType: "opening",
            referenceType: "inventory_item",
            referenceId: inventory.id,
            note: "Opening stock on item creation",
        });
    }
    revalidatePath("/dashboard/inventory", "page");
    triggerSync(actualOrgId, 'inventory');

    return inventory;
}

export async function updateInventoryStock(id: string, newStock: number, orgId: string): Promise<void> {
    const actor = await authorize("Update Stock", undefined, orgId);

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
    const delta = Number(newStock) - Number(prev.stock || 0);
    if (delta !== 0) {
        await recordStockMovement({
            orgId,
            inventoryId: id,
            quantityDelta: delta,
            movementType: "adjustment",
            referenceType: "inventory_adjustment",
            referenceId: id,
            note: "Manual stock update",
            createdBy: actor.id,
        });
    }

    (revalidateTag as any)(`inventory-${orgId}`);
    revalidatePath("/dashboard/inventory", "page");
    triggerSync(orgId, 'inventory');
}

export async function getLowStockItems(orgId: string): Promise<InventoryItem[]> {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async (): Promise<InventoryItem[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            // Fetch items where stock is less than or equal to min_stock
            const data = await db`
                SELECT * FROM inventory 
                WHERE org_id = ${orgId} 
                AND stock <= min_stock 
                ORDER BY stock ASC
            `;

            return data.map((item: any) => ({
                ...item,
                buy_price: parseFloat(item.buy_price),
                sell_price: item.sell_price === null || item.sell_price === undefined ? undefined : parseFloat(item.sell_price),
                gst_percentage: parseFloat(item.gst_percentage),
                min_stock: item.min_stock || 5
            })) as InventoryItem[];
        },
        [`inventory-low-stock-${flavor}-${orgId}`],
        { tags: ["inventory", `inventory-${orgId}`, "low-stock", `inventory-${flavor}`], revalidate: 600 }
    )();
}
export async function getInventoryStats(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    return nextCache(
        async (): Promise<{ totalCount: number, lowStockCount: number, health: number }> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const result = await db`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE stock <= min_stock) as low_stock,
                    COUNT(*) FILTER (WHERE stock > 5) as in_stock
                FROM inventory 
                WHERE org_id = ${orgId}
            `;

            const row = result[0];
            const total = parseInt(row.total);
            const inStock = parseInt(row.in_stock);
            const lowStock = parseInt(row.low_stock);
            const health = total > 0 ? Math.round((inStock / total) * 100) : 100;

            return {
                totalCount: total,
                lowStockCount: lowStock,
                health: health
            };
        },
        [`inventory-stats-${flavor}-${orgId}`],
        { tags: ["inventory", `inventory-${orgId}`, `inventory-${flavor}`], revalidate: 3600 }
    )();
}
