"use server"

import { parse } from "csv-parse/sync"
import { sql } from "./db"
import { authorize, audit } from "./security"
import { revalidatePath, revalidateTag } from "next/cache"

/**
 * Bulk import inventory items from CSV data.
 */
export async function importInventory(csvContent: string, orgId: string) {
    await authorize("Import Inventory", "admin", orgId)

    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as any[]

    if (records.length === 0) {
      throw new Error("No valid records found in CSV")
    }

    let importedCount = 0

    for (const record of records) {
        // Basic mapping - users might have different column names, 
        // but we expect SKU, Name, Buy Price, GST, Stock
        const sku = record.sku || record.SKU || ""
        const name = record.name || record.Name || ""
        const buyPrice = parseFloat(record.buy_price || record.price || record.Cost || "0")
        const gst = parseFloat(record.gst || record.GST || record.tax || "0")
        const stock = parseFloat(record.stock || record.Stock || record.Quantity || "0")

        if (!name) {
          continue // Skip invalid rows
        }

        await sql`
            INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock, org_id)
            VALUES (${sku}, ${name}, ${buyPrice}, ${gst}, ${stock}, ${orgId})
            ON CONFLICT (sku, org_id) DO UPDATE SET
                name = EXCLUDED.name,
                buy_price = EXCLUDED.buy_price,
                gst_percentage = EXCLUDED.gst_percentage,
                stock = inventory.stock + EXCLUDED.stock,
                updated_at = CURRENT_TIMESTAMP
        `
        importedCount++
    }

    await audit("Imported Inventory", "inventory", orgId, { count: importedCount }, orgId);

    (revalidateTag as any)(`inventory-${orgId}`)
    revalidatePath("/dashboard/inventory", "page")

    return { success: true, count: importedCount }
}

/**
 * Bulk import customers from CSV data.
 */
export async function importCustomers(csvContent: string, orgId: string) {
    await authorize("Import Customers", "admin", orgId)

    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as any[]

    if (records.length === 0) {
      throw new Error("No valid records found in CSV")
    }

    let importedCount = 0

    for (const record of records) {
        const name = record.name || record.Name || ""
        const phone = record.phone || record.Phone || record.Mobile || ""
        const address = record.address || record.Address || ""

        if (!name || !phone) {
          continue
        }

        await sql`
            INSERT INTO customers (name, phone, address, org_id)
            VALUES (${name}, ${phone}, ${address}, ${orgId})
            ON CONFLICT (phone, org_id) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                updated_at = CURRENT_TIMESTAMP
        `
        importedCount++
    }

    await audit("Imported Customers", "customer", orgId, { count: importedCount }, orgId);

    (revalidateTag as any)(`customers-${orgId}`)
    revalidatePath("/dashboard/customers", "page")

    return { success: true, count: importedCount }
}
