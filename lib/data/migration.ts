"use server"

import { sql } from "../db";
import { authorize } from "../security";
import { decrypt } from "../crypto";
import { getTenantDEK } from "../key-management";

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

        const { revalidateTag, revalidatePath } = await import("next/cache")

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
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Inventory] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            const { audit } = await import("../security")
            await audit("Imported Inventory", "inventory", undefined, { count: results.success }, orgId)
        } catch (auditError) {
            console.error("[Import/Inventory] Audit logging failed (non-fatal):", auditError)
        }

        try {
            await (revalidateTag as any)("inventory");
            await (revalidateTag as any)(`inventory-${orgId}`);
            await revalidatePath("/dashboard/inventory", "page");
        } catch (e) {
            console.warn("[Import/Inventory] Cache revalidation failed:", e)
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

        const { encrypt } = await import("../crypto")
        const { getTenantDEK, initializeTenantDEKs } = await import("../key-management")
        const { revalidateTag, revalidatePath } = await import("next/cache")

        let dek: string
        try {
            dek = await getTenantDEK(orgId)
        } catch {
            console.log(`[Import/Customers] No DEK found, initializing...`)
            await initializeTenantDEKs()
            dek = await getTenantDEK(orgId)
        }

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

                const encryptedName = await encrypt(name, orgId, dek)
                const encryptedPhone = await encrypt(phone.toString(), orgId, dek)
                const encryptedAddress = address ? await encrypt(address, orgId, dek) : null

                await sql`
                    INSERT INTO customers (id, name, phone, address, org_id)
                    VALUES (gen_random_uuid(), ${encryptedName}, ${encryptedPhone}, ${encryptedAddress}, ${orgId})
                    ON CONFLICT (phone) DO UPDATE SET
                        name = EXCLUDED.name,
                        address = EXCLUDED.address,
                        updated_at = CURRENT_TIMESTAMP
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Customers] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            const { audit } = await import("../security")
            await audit("Imported Customers", "customer", undefined, { count: results.success }, orgId)
            await (revalidateTag as any)(`customers-${orgId}`);
            await revalidatePath("/dashboard/customers", "page");
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

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        const { revalidateTag, revalidatePath } = await import("next/cache")

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

                // ROBUST: Payment status with fallback
                const payment_status = item.payment_status || item.payment_method || item.payment || "completed"

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

                const buy_price = parseFloat(inventory[0].buy_price) || 0
                const profit = parseFloat(item.profit?.toString() || "") || ((sale_price - buy_price) * quantity)
                const taxable_amount = parseFloat(item.taxable_amount?.toString() || "") || (total_amount - gst_amount)
                const cgst = parseFloat(item.cgst_amount?.toString() || "") || (gst_amount / 2)
                const sgst = parseFloat(item.sgst_amount?.toString() || "") || (gst_amount / 2)

                await sql`
                    INSERT INTO sales (
                        id, inventory_id, user_id, org_id, quantity, sale_price, 
                        total_amount, gst_amount, profit, payment_status, 
                        sale_date, taxable_amount, cgst_amount, sgst_amount,
                        customer_name, customer_phone
                    )
                    VALUES (
                        gen_random_uuid(), ${inventory[0].id}, ${user.id}, ${orgId}, ${quantity}, ${sale_price}, 
                        ${total_amount}, ${gst_amount}, ${profit}, ${payment_status}, 
                        ${sale_date}, ${taxable_amount}, ${cgst}, ${sgst},
                        ${item.customer_name || item.customer || null}, ${item.customer_phone || item.phone || null}
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
            const { audit } = await import("../security")
            await audit("Imported Sales", "sale", undefined, { count: results.success }, orgId)
            await revalidatePath("/dashboard/sales", "page");
            await (revalidateTag as any)("sales");
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

        const { encrypt } = await import("../crypto")
        const { getTenantDEK, initializeTenantDEKs } = await import("../key-management")
        const { revalidateTag, revalidatePath } = await import("next/cache")

        let dek: string
        try {
            dek = await getTenantDEK(orgId)
        } catch {
            console.log(`[Import/Suppliers] No DEK found, initializing...`)
            await initializeTenantDEKs()
            dek = await getTenantDEK(orgId)
        }

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

                const encryptedName = await encrypt(name, orgId, dek)
                const encryptedPhone = await encrypt(phone.toString(), orgId, dek)
                const encryptedAddress = address ? await encrypt(address, orgId, dek) : null

                await sql`
                    INSERT INTO suppliers (id, name, phone, address, org_id)
                    VALUES (gen_random_uuid(), ${encryptedName}, ${encryptedPhone}, ${encryptedAddress}, ${orgId})
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Suppliers] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            const { audit } = await import("../security")
            await audit("Imported Suppliers", "supplier", undefined, { count: results.success }, orgId)
            await (revalidateTag as any)(`suppliers-${orgId}`);
            await revalidatePath("/dashboard/suppliers", "page");
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

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        const { revalidateTag, revalidatePath } = await import("next/cache")

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
                    VALUES (gen_random_uuid(), ${category}, ${amount}, ${description}, ${expense_date}, ${user.id}, ${orgId})
                `
                results.success++
            } catch (itemError: any) {
                console.error(`[Import/Expenses] Row ${i + 1} failed:`, itemError.message)
                results.failed++
                results.errors.push(`Row ${i + 1}: ${itemError.message}`)
            }
        }

        try {
            const { audit } = await import("../security")
            await audit("Imported Expenses", "expense", undefined, { count: results.success }, orgId)
            await revalidatePath("/dashboard/reports", "page");
            await (revalidateTag as any)(`reports-${orgId}`);
        } catch (e) {
            console.warn("[Import/Expenses] Non-fatal cleanup error:", e)
        }

        return { success: true, count: results.success, failed: results.failed, errors: results.errors }
    } catch (error: any) {
        console.error("FATAL: importExpenses crashed:", error)
        throw new Error(`Import failed: ${error.message}`)
    }
}
