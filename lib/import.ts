"use server"

import { parse } from "csv-parse/sync"
import { sql } from "./db"
import { authorize, audit } from "./security"
import { revalidatePath, revalidateTag } from "next/cache"

const MAX_CSV_SIZE = 1 * 1024 * 1024; // 1MB limit
const MAX_RECORDS = 500;

/**
 * Bulk import inventory items from CSV data.
 */
export async function importInventory(csvContent: string, orgId: string) {
  await authorize("Import Inventory", "admin", orgId)

  // SECURITY: Limit payload size
  if (csvContent.length > MAX_CSV_SIZE) {
    throw new Error("CSV file too large (Max 1MB allowed)");
  }

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as any[]

  if (records.length === 0) {
    throw new Error("No valid records found in CSV")
  }

  if (records.length > MAX_RECORDS) {
    throw new Error(`Import limit exceeded (Max ${MAX_RECORDS} records per upload)`);
  }

  const { InventorySchema } = await import("./validation");
  let importedCount = 0

  for (const record of records) {
    // Normalize record mapping
    const mappedRecord = {
      sku: record.sku || record.SKU || "",
      name: record.name || record.Name || "",
      buy_price: parseFloat(record.buy_price || record.price || record.Cost || "0"),
      gst_percentage: parseFloat(record.gst || record.GST || record.tax || "0"),
      stock: parseFloat(record.stock || record.Stock || record.Quantity || "0"),
      org_id: orgId
    };

    // Validate via Zod
    const validation = InventorySchema.safeParse(mappedRecord);
    if (!validation.success) continue; // Skip invalid rows

    const { sku, name, buy_price, gst_percentage, stock } = validation.data;

    await sql`
            INSERT INTO inventory (sku, name, buy_price, gst_percentage, stock, org_id)
            VALUES (${sku}, ${name}, ${buy_price}, ${gst_percentage}, ${stock}, ${orgId})
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

  if (csvContent.length > MAX_CSV_SIZE) {
    throw new Error("CSV file too large (Max 1MB allowed)");
  }

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as any[]

  if (records.length === 0) {
    throw new Error("No valid records found in CSV")
  }

  if (records.length > MAX_RECORDS) {
    throw new Error(`Import limit exceeded (Max ${MAX_RECORDS} records per upload)`);
  }

  const { CustomerSchema } = await import("./validation");
  let importedCount = 0

  for (const record of records) {
    const mappedRecord = {
      name: record.name || record.Name || "",
      phone: record.phone || record.Phone || record.Mobile || "",
      address: record.address || record.Address || "",
      org_id: orgId
    };

    const validation = CustomerSchema.safeParse(mappedRecord);
    if (!validation.success) continue;

    const { name, phone, address } = validation.data;

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
