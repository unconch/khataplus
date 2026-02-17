"use server"

import { sql } from "../db";
import { authorize, audit } from "../security";
import { decrypt, encrypt } from "../crypto";
import { getTenantDEK, initializeTenantDEKs } from "../key-management";
import { triggerSync } from "../sync-notifier";
import { syncDailyReport } from "./reports";
import { revalidatePath, revalidateTag } from "next/cache";

async function resolveImportDEK(orgId: string, label: "Customers" | "Suppliers"): Promise<string | null> {
    try {
        return await getTenantDEK(orgId);
    } catch {
        try {
            console.log(`[Import/${label}] No DEK found, initializing...`);
            await initializeTenantDEKs();
            return await getTenantDEK(orgId);
        } catch (error) {
            console.warn(`[Import/${label}] Proceeding without encryption for org ${orgId}:`, error);
            return null;
        }
    }
}

export async function exportData(orgId: string, type: string) {
    await authorize(`Export ${type}`, "manager", orgId);

    let data: any[] = [];

    switch (type) {
        case "inventory":
            data = await sql`SELECT * FROM inventory WHERE org_id = ${orgId} ORDER BY name ASC`;
            break;
        case "customers":
            data = await sql`SELECT * FROM customers WHERE org_id = ${orgId} ORDER BY name ASC`;
            data = await decryptList(data, orgId);
            break;
        case "suppliers":
            data = await sql`SELECT * FROM suppliers WHERE org_id = ${orgId} ORDER BY name ASC`;
            data = await decryptList(data, orgId);
            break;
        case "sales":
            data = await sql`SELECT * FROM sales WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT 1000`;
            break;
        case "expenses":
            data = await sql`SELECT * FROM expenses WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT 1000`;
            break;
        default:
            throw new Error(`Unsupported export type: ${type}`);
    }

    return data;
}

async function decryptList(list: any[], orgId: string) {
    let dek: string | undefined;
    try {
        dek = await getTenantDEK(orgId);
    } catch (e) {
        console.warn(`[exportData] No DEK for org ${orgId}, assuming unencrypted data`);
        return list;
    }

    if (!dek) return list;

    return Promise.all(list.map(async (row: any) => {
        let name = row.name;
        let phone = row.phone;
        let address = row.address;

        if (row.name && row.name.startsWith('{')) {
            try {
                name = await decrypt(row.name, orgId, dek);
                phone = row.phone && row.phone.startsWith('{') ? await decrypt(row.phone, orgId, dek) : row.phone;
                address = row.address && row.address.startsWith('{') ? await decrypt(row.address, orgId, dek) : row.address;
            } catch (e) {
                console.error(`[exportData] Decryption failed for row ${row.id}:`, e);
            }
        }

        return {
            ...row,
            name,
            phone,
            address
        };
    }));
}

export async function importInventory(orgId: string, items: any[]) {
    try {
        console.log(`[Import/Inventory] Starting import for org ${orgId} with ${items.length} items...`)
        const user = await authorize("Import Inventory", "manager", orgId)

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }



        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            try {
                // ROBUST: Generate SKU if missing
                const sku = item.sku || item.SKU || item.code || `AUTO-${Date.now()}-${i}`

                // ROBUST: Use product name or generate one
                const name = item.name || item.Name || item.product || `Product ${i + 1}`

                // ROBUST: Parse prices with fallbacks
                const buy_price = parseFloat(item.buy_price || item.Cost || item.cost || item.price || "0") || 0
                const sell_price = parseFloat(item.sell_price || item.MRP || item.mrp || item.price || item.selling_price || buy_price || "0") || 0

                // ROBUST: Parse stock with fallback
                const stock = parseInt(item.stock || item.Stock || item.Quantity || item.quantity || item.qty || "0") || 0

                // ROBUST: Parse GST with fallback
                const gst_percentage = parseFloat(item.gst_percentage || item.GST || item.gst || item.tax || item.Tax || "0") || 0

                // ROBUST: Parse min_stock with fallback
                const min_stock = parseInt(item.min_stock || item.reorder_level || item.minimum || "5") || 5

                // ROBUST: HSN code with fallback
                const hsn_code = item.hsn_code || item.HSN || item.hsn || ""

                // ROBUST: Preserve original ID if it's a valid UUID (needed for sales FK references)
                const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
                const originalId = item.id || item.ID
                const id = (originalId && isUUID(originalId)) ? originalId : null

                await sql`
                    INSERT INTO inventory (
                        id, org_id, sku, name, buy_price, sell_price, 
                        stock, hsn_code, gst_percentage, min_stock
                    ) VALUES (
                        COALESCE(${id}::uuid, gen_random_uuid()), ${orgId}, ${sku}, ${name}, ${buy_price},
                        ${sell_price}, ${stock}, ${hsn_code},
                        ${gst_percentage}, ${min_stock}
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        org_id = EXCLUDED.org_id,
                        sku = EXCLUDED.sku,
                        name = EXCLUDED.name,
                        buy_price = EXCLUDED.buy_price,
                        sell_price = EXCLUDED.sell_price,
                        stock = EXCLUDED.stock,
                        hsn_code = EXCLUDED.hsn_code,
                        gst_percentage = EXCLUDED.gst_percentage,
                        min_stock = EXCLUDED.min_stock,
                        updated_at = NOW()
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Inventory] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            await audit("Imported Inventory", "inventory", undefined, { count: results.success }, orgId)
        } catch (auditError) {
            console.error("[Import/Inventory] Audit logging failed (non-fatal):", auditError)
        }

        try {
            (revalidateTag as any)("inventory");
            (revalidateTag as any)(`inventory-${orgId}`);
            revalidatePath("/dashboard/inventory", "page");
            await triggerSync(orgId, "inventory");
        } catch (e) {
            console.warn("[Import/Inventory] Cache revalidation or sync failed:", e)
        }

        return {
            success: true,
            count: results.success,
            failed: results.failed,
            errors: results.errors
        }

    } catch (error: any) {
        console.error("FATAL: importInventory crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importCustomers(orgId: string, items: any[]) {
    try {
        console.log(`[Import/Customers] Starting import for org ${orgId} with ${items.length} items...`)
        const user = await authorize("Import Customers", "manager", orgId)

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        const dek = await resolveImportDEK(orgId, "Customers")

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            try {
                // ROBUST: Generate name if missing
                const name = item.name || item.Name || item.customer || item.Customer || `Customer ${i + 1}`

                // ROBUST: Phone - try multiple fields, auto-generate placeholder if missing
                const rawPhone = item.phone || item.Phone || item.Mobile || item.mobile || item.contact || item.number
                const phone = rawPhone || `00000${(i + 1).toString().padStart(5, '0')}`
                if (!rawPhone) {
                    console.log(`[Import/Customers] Row ${i + 1}: No phone found, using placeholder ${phone}`)
                }

                // ROBUST: Address with fallback
                const address = item.address || item.Address || item.location || ""

                const safePhone = phone.toString()
                const storedName = dek ? await encrypt(name, orgId, dek) : name
                const storedPhone = dek ? await encrypt(safePhone, orgId, dek) : safePhone
                const storedAddress = address
                    ? (dek ? await encrypt(address, orgId, dek) : address)
                    : null

                await sql`
                    INSERT INTO customers (id, name, phone, address, org_id)
                    VALUES (gen_random_uuid(), ${storedName}, ${storedPhone}, ${storedAddress}, ${orgId})
                    ON CONFLICT DO NOTHING
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Customers] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            await audit("Imported Customers", "customer", undefined, { count: results.success }, orgId);
            (revalidateTag as any)(`customers-${orgId}`);
            revalidatePath("/dashboard/customers", "page");
            await triggerSync(orgId, "customer");
        } catch (e) {
            console.warn("[Import/Customers] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importCustomers crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importSales(orgId: string, items: any[]) {
    try {
        console.log(`[Import/Sales] Starting import for org ${orgId} with ${items.length} items...`)
        const user = await authorize("Import Sales", "manager", orgId)
        const { isGuestMode } = await import("./auth")
        const isGuest = await isGuestMode()
        const actorUserId = isGuest ? null : user.id

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }
        const uniqueDates = new Set<string>()

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            try {
                const sku = item.sku || item.SKU || item.code || item.product_code
                const productName = item.name || item.product || item.item || item.product_name
                const inventoryId = item.inventory_id || item.product_id

                // UUID pattern for detecting foreign key references
                const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

                // ROBUST: Try multiple lookup strategies
                let inventory: any[] = []

                // Strategy 1: Direct inventory_id lookup (UUID foreign key from source DB)
                if (inventoryId && isUUID(inventoryId)) {
                    inventory = await sql`SELECT id, buy_price, name FROM inventory WHERE id = ${inventoryId} AND org_id = ${orgId} LIMIT 1`
                }

                // Strategy 2: If SKU looks like a UUID, try it as inventory ID
                if (inventory.length === 0 && sku && isUUID(sku)) {
                    inventory = await sql`SELECT id, buy_price, name FROM inventory WHERE id = ${sku} AND org_id = ${orgId} LIMIT 1`
                }

                // Strategy 3: Standard SKU lookup
                if (inventory.length === 0 && sku && !isUUID(sku)) {
                    inventory = await sql`SELECT id, buy_price, name FROM inventory WHERE sku = ${sku} AND org_id = ${orgId} LIMIT 1`
                }

                // Strategy 4: Name-based match
                if (inventory.length === 0 && productName) {
                    inventory = await sql`SELECT id, buy_price, name FROM inventory WHERE org_id = ${orgId} AND LOWER(name) = LOWER(${productName}) LIMIT 1`
                }

                if (inventory.length === 0) {
                    results.failed++
                    results.errors.push(`Row ${i + 1}: Product "${sku || inventoryId || productName || 'unknown'}" not found in inventory`)
                    continue
                }

                // ROBUST: Parse numbers with fallbacks
                const quantity = parseFloat(item.quantity || item.Quantity || item.qty || "1") || 1
                const sale_price = parseFloat(item.sale_price || item.Price || item.price || item.amount || "0") || 0
                const total_amount = parseFloat(item.total_amount || item.total || (sale_price * quantity).toString()) || (sale_price * quantity)
                const gst_amount = parseFloat(item.gst_amount || item.GST || item.tax || "0") || 0

                // Normalize to app schema payment_method values
                const paymentRaw = String(item.payment_method || item.payment_status || item.payment || "Cash").toLowerCase()
                const payment_method =
                    paymentRaw.includes("credit") ? "Credit" :
                        paymentRaw.includes("upi") || paymentRaw.includes("online") ? "UPI" :
                            "Cash"

                // ROBUST: Date with fallback to now + Excel serial number conversion
                const rawDate = item.sale_date || item.date || item.Date || item.created_at || null
                let sale_date: string
                if (!rawDate) {
                    sale_date = new Date().toISOString()
                } else if (typeof rawDate === 'number' || (typeof rawDate === 'string' && /^\d{4,5}(\.\d+)?$/.test(rawDate.trim()))) {
                    // Excel serial date: days since 1899-12-30
                    const excelEpoch = new Date(1899, 11, 30) // Dec 30, 1899
                    const days = parseFloat(rawDate.toString())
                    const ms = excelEpoch.getTime() + days * 86400000
                    sale_date = new Date(ms).toISOString()
                } else {
                    sale_date = new Date(rawDate).toISOString() || new Date().toISOString()
                }

                const dateOnly = sale_date.split('T')[0]
                uniqueDates.add(dateOnly)

                const buy_price = parseFloat(inventory[0].buy_price) || 0
                const profit = parseFloat(item.profit?.toString() || "") || ((sale_price - buy_price) * quantity)

                await sql`
                    INSERT INTO sales (
                        id, inventory_id, user_id, org_id, quantity, sale_price, 
                        total_amount, gst_amount, profit, payment_method, 
                        sale_date
                    )
                    VALUES (
                        gen_random_uuid(), ${inventory[0].id}, ${actorUserId}, ${orgId}, ${quantity}, ${sale_price}, 
                        ${total_amount}, ${gst_amount}, ${profit}, ${payment_method}, 
                        ${dateOnly}
                    )
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Sales] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            await audit("Imported Sales", "sale", undefined, { count: results.success }, orgId)

            // Sync Daily Reports for all affected dates
            console.log(`[Import/Sales] Syncing daily reports for ${uniqueDates.size} dates...`)
            for (const date of Array.from(uniqueDates)) {
                await syncDailyReport(date, orgId)
            }

            revalidatePath("/dashboard/sales", "page");
            revalidatePath("/dashboard/reports", "page");
            (revalidateTag as any)("sales");
            (revalidateTag as any)(`sales-${orgId}`);
            (revalidateTag as any)(`reports-${orgId}`);
            await triggerSync(orgId, "sale");
            await triggerSync(orgId, "report");
        } catch (e) {
            console.warn("[Import/Sales] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importSales crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importSuppliers(orgId: string, items: any[]) {
    try {
        console.log(`[Import/Suppliers] Starting import for org ${orgId} with ${items.length} items...`)
        const user = await authorize("Import Suppliers", "manager", orgId)

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        const dek = await resolveImportDEK(orgId, "Suppliers")

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            try {
                // ROBUST: Generate name if missing
                const name = item.name || item.Name || item.supplier || item.Supplier || `Supplier ${i + 1}`

                // ROBUST: Phone - try multiple fields, auto-generate placeholder if missing
                const rawPhone = item.phone || item.Phone || item.Mobile || item.mobile || item.contact || item.number
                const phone = rawPhone || `00000${(i + 1).toString().padStart(5, '0')}`
                if (!rawPhone) {
                    console.log(`[Import/Suppliers] Row ${i + 1}: No phone found, using placeholder ${phone}`)
                }

                // ROBUST: Address with fallback
                const address = item.address || item.Address || item.location || ""

                const safePhone = phone.toString()
                const storedName = dek ? await encrypt(name, orgId, dek) : name
                const storedPhone = dek ? await encrypt(safePhone, orgId, dek) : safePhone
                const storedAddress = address
                    ? (dek ? await encrypt(address, orgId, dek) : address)
                    : null

                await sql`
                    INSERT INTO suppliers (id, name, phone, address, org_id)
                    VALUES (gen_random_uuid(), ${storedName}, ${storedPhone}, ${storedAddress}, ${orgId})
                    ON CONFLICT DO NOTHING
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Suppliers] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            await audit("Imported Suppliers", "supplier", undefined, { count: results.success }, orgId)
            revalidatePath("/dashboard/suppliers", "page");
            (revalidateTag as any)(`suppliers-${orgId}`);
            await triggerSync(orgId, "khata");
        } catch (e) {
            console.warn("[Import/Suppliers] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importSuppliers crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}

export async function importExpenses(orgId: string, items: any[]) {
    try {
        console.log(`[Import/Expenses] Starting import for org ${orgId} with ${items.length} items...`)
        const user = await authorize("Import Expenses", "manager", orgId)
        const { isGuestMode } = await import("./auth")
        const isGuest = await isGuestMode()
        const actorUserId = isGuest ? null : user.id

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }



        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            try {
                // ROBUST: Category with fallback
                const category = item.category || item.Category || item.type || "Miscellaneous"

                // ROBUST: Parse amount with fallback
                const amount = parseFloat(item.amount || item.Amount || item.price || item.cost || "0") || 0

                // ROBUST: Description with fallback
                const description = item.description || item.Description || item.note || item.details || ""

                // ROBUST: Date with fallback
                const expense_date = item.expense_date || item.date || item.Date || new Date().toISOString()

                if (amount <= 0) {
                    results.failed++
                    results.errors.push(`Row ${i + 1}: Invalid amount (${amount}) for expense: ${description || category}`)
                    continue
                }

                await sql`
                    INSERT INTO expenses (id, category, amount, description, expense_date, created_by, org_id)
                    VALUES (gen_random_uuid(), ${category}, ${amount}, ${description}, ${expense_date}, ${actorUserId}, ${orgId})
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Expenses] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            await audit("Imported Expenses", "expense", undefined, { count: results.success }, orgId)
            revalidatePath("/dashboard/reports", "page");
            (revalidateTag as any)(`reports-${orgId}`);
            await triggerSync(orgId, "report");
        } catch (e) {
            console.warn("[Import/Expenses] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importExpenses crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}
