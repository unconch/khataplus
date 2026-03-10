"use server"

import { sql, getProductionSql } from "../db";
import type { InventoryItem } from "../types";
import { logHealthMetric } from "../monitoring";
import { revalidatePath, revalidateTag, unstable_cache as nextCache } from "next/cache";
import { authorize, audit } from "../security";
import { triggerSync } from "../sync-notifier";
import { recordStockMovement } from "./stock-movements";
import { getInventoryItemLimit } from "../billing-plans";

async function hasInventoryArchivedColumn(db: any): Promise<boolean> {
    const result = await db`
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'inventory'
          AND column_name = 'is_archived'
        LIMIT 1
    `;
    return result.length > 0;
}

async function hasInventoryArchivedColumnProd(): Promise<boolean> {
    const db = getProductionSql();
    return hasInventoryArchivedColumn(db);
}

const hasInventoryArchivedColumnProdCached = nextCache(
    hasInventoryArchivedColumnProd,
    ["schema:inventory:is_archived"],
    { revalidate: 86400 }
);

export async function getInventory(orgId: string, options: { limit?: number; offset?: number } = { limit: 1000 }) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";
    const limit = options.limit ?? 1000;
    const offset = options.offset ?? 0;

    const fetchInventory = async (): Promise<InventoryItem[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const start = Date.now();
            const hasArchiveColumn = isGuest ? await hasInventoryArchivedColumn(db) : await hasInventoryArchivedColumnProdCached();
            const data = hasArchiveColumn
                ? await db`
                    SELECT * FROM inventory 
                    WHERE org_id = ${orgId} 
                      AND COALESCE(is_archived, false) = false
                    ORDER BY name ASC
                    LIMIT ${limit}
                    OFFSET ${offset}
                `
                : await db`
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
                min_stock: item.min_stock || 5,
                category: item.category || undefined
            })) as InventoryItem[];
        };

    if (isGuest) {
        return fetchInventory();
    }

    return nextCache(
        fetchInventory,
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
        min_stock: item.min_stock || 5,
        category: item.category || undefined
    } as InventoryItem;
}

export async function archiveInventoryItem(id: string, orgId: string): Promise<void> {
    await authorize("Archive Inventory", "admin", orgId);

    const existing = await sql`
        SELECT id, name
        FROM inventory
        WHERE id = ${id} AND org_id = ${orgId}
        LIMIT 1
    `;
    if (existing.length === 0) {
        throw new Error("Item not found");
    }

    const hasArchiveColumn = await hasInventoryArchivedColumn(sql);
    if (!hasArchiveColumn) {
        await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE`;
    }

    await sql`
        UPDATE inventory
        SET is_archived = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND org_id = ${orgId}
    `;

    await audit("Archived Inventory", "inventory", id, { name: existing[0].name }, orgId);
    (revalidateTag as any)(`inventory-${orgId}`);
    revalidatePath("/dashboard/inventory", "page");
    triggerSync(orgId, 'inventory');
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
        INSERT INTO inventory(sku, name, buy_price, sell_price, gst_percentage, stock, min_stock, category, org_id)
        VALUES(${item.sku}, ${item.name}, ${item.buy_price}, ${item.sell_price ?? null}, ${item.gst_percentage}, ${item.stock}, ${item.min_stock || 5}, ${item.category ?? null}, ${actualOrgId})
        RETURNING *
    `;
    const newItem = result[0] as any;
    const inventory = {
        ...newItem,
        buy_price: parseFloat(newItem.buy_price),
        sell_price: newItem.sell_price === null || newItem.sell_price === undefined ? undefined : parseFloat(newItem.sell_price),
        gst_percentage: parseFloat(newItem.gst_percentage),
        category: newItem.category || undefined
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

    const fetchLowStock = async (): Promise<InventoryItem[]> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            // Fetch items where stock is less than or equal to min_stock
            const hasArchiveColumn = isGuest ? await hasInventoryArchivedColumn(db) : await hasInventoryArchivedColumnProdCached();
            const data = hasArchiveColumn
                ? await db`
                    SELECT * FROM inventory 
                    WHERE org_id = ${orgId} 
                    AND COALESCE(is_archived, false) = false
                    AND stock <= min_stock 
                    ORDER BY stock ASC
                `
                : await db`
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
        };

    if (isGuest) {
        return fetchLowStock();
    }

    return nextCache(
        fetchLowStock,
        [`inventory-low-stock-${flavor}-${orgId}`],
        { tags: ["inventory", `inventory-${orgId}`, "low-stock", `inventory-${flavor}`], revalidate: 600 }
    )();
}
export async function getInventoryStats(orgId: string) {
    const { isGuestMode } = await import("./auth");
    const isGuest = await isGuestMode();
    const flavor = isGuest ? "demo" : "prod";

    const fetchStats = async (): Promise<{ totalCount: number, lowStockCount: number, health: number }> => {
            const { getDemoSql, getProductionSql } = await import("../db");
            const db = isGuest ? getDemoSql() : getProductionSql();

            const hasArchiveColumn = isGuest ? await hasInventoryArchivedColumn(db) : await hasInventoryArchivedColumnProdCached();
            const result = hasArchiveColumn
                ? await db`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(*) FILTER (WHERE stock <= min_stock) as low_stock,
                        COUNT(*) FILTER (WHERE stock > 5) as in_stock
                    FROM inventory 
                    WHERE org_id = ${orgId}
                      AND COALESCE(is_archived, false) = false
                `
                : await db`
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
        };

    if (isGuest) {
        return fetchStats();
    }

    return nextCache(
        fetchStats,
        [`inventory-stats-${flavor}-${orgId}`],
        { tags: ["inventory", `inventory-${orgId}`, `inventory-${flavor}`], revalidate: 3600 }
    )();
}
