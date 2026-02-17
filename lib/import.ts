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
  // Parsing is still done here as per architecture
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as any[]

  if (records.length === 0) {
    throw new Error("No valid records found in CSV")
  }

  // Delegate to the centralized, hardened logic
  const { importInventory: doImport } = await import("./data/migration");
  return await doImport(orgId, records);
}

/**
 * Bulk import customers from CSV data.
 */
export async function importCustomers(csvContent: string, orgId: string) {
  const user = await authorize("Import Customers", "admin", orgId)

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

    const { encrypt } = await import("./crypto");
    const { getTenantDEK } = await import("./key-management");
    const dek = await getTenantDEK(orgId);

    const encryptedName = await encrypt(name, orgId, dek);
    const encryptedPhone = await encrypt(phone, orgId, dek);
    const encryptedAddress = address ? await encrypt(address, orgId, dek) : null;

    await sql`
            INSERT INTO customers (name, phone, address, org_id)
            VALUES (${encryptedName}, ${encryptedPhone}, ${encryptedAddress}, ${orgId})
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

/**
 * Bulk import suppliers from CSV data.
 */
export async function importSuppliers(csvContent: string, orgId: string) {
  const user = await authorize("Import Suppliers", "admin", orgId)

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

  const { SupplierSchema } = await import("./validation");
  let importedCount = 0

  for (const record of records) {
    const mappedRecord = {
      name: record.name || record.Name || "",
      phone: record.phone || record.Phone || record.Mobile || "",
      address: record.address || record.Address || "",
      org_id: orgId
    };

    const validation = SupplierSchema.safeParse(mappedRecord);
    if (!validation.success) continue;

    const { name, phone, address } = validation.data;

    const { encrypt } = await import("./crypto");
    const { getTenantDEK } = await import("./key-management");
    const dek = await getTenantDEK(orgId);

    const encryptedName = await encrypt(name, orgId, dek);
    const encryptedPhone = await encrypt(phone, orgId, dek);
    const encryptedAddress = address ? await encrypt(address, orgId, dek) : null;

    await sql`
            INSERT INTO suppliers (name, phone, address, org_id)
            VALUES (${encryptedName}, ${encryptedPhone}, ${encryptedAddress}, ${orgId})
            ON CONFLICT (phone, org_id) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                updated_at = CURRENT_TIMESTAMP
        `
    importedCount++
  }

  await audit("Imported Suppliers", "supplier", orgId, { count: importedCount }, orgId);

  (revalidateTag as any)(`suppliers-${orgId}`)
  revalidatePath("/dashboard/suppliers", "page")

  return { success: true, count: importedCount }
}

/**
 * Bulk import sales history from CSV data.
 */
export async function importSales(csvContent: string, orgId: string) {
  const user = await authorize("Import Sales", "admin", orgId)

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

  let importedCount = 0

  for (const record of records) {
    const sku = record.sku || record.SKU || "";
    if (!sku) continue;

    const inventory = await sql`SELECT id, buy_price, name FROM inventory WHERE sku = ${sku} AND org_id = ${orgId} LIMIT 1`;
    if (inventory.length === 0) continue;

    const quantity = parseFloat(record.quantity || record.Quantity || "1");
    const sale_price = parseFloat(record.sale_price || record.price || record.Price || "0");
    const total_amount = parseFloat(record.total_amount || record.total || record.Total || (sale_price * quantity).toString());
    const gst_amount = parseFloat(record.gst_amount || record.gst || record.tax || "0");
    const payment_method = record.payment_method || record.payment || "Cash";
    const sale_date = record.sale_date || record.date || new Date().toISOString();

    // Calculate profit
    const buy_price = parseFloat(inventory[0].buy_price);
    const profit = (sale_price - buy_price) * quantity;
    const taxable_amount = total_amount - gst_amount;
    const cgst = gst_amount / 2;
    const sgst = gst_amount / 2;

    await sql`
      INSERT INTO sales (
        inventory_id, user_id, org_id, quantity, sale_price, 
        total_amount, gst_amount, profit, payment_method, 
        sale_date, taxable_amount, cgst_amount, sgst_amount,
        customer_name, customer_phone
      )
      VALUES (
        ${inventory[0].id}, ${user.id}, ${orgId}, ${quantity}, ${sale_price}, 
        ${total_amount}, ${gst_amount}, ${profit}, ${payment_method}, 
        ${sale_date}, ${taxable_amount}, ${cgst}, ${sgst},
        ${record.customer_name || null}, ${record.customer_phone || null}
      )
    `;
    importedCount++
  }

  await audit("Imported Sales", "sale", orgId, { count: importedCount }, orgId);
  revalidatePath("/dashboard/sales", "page");
  (revalidateTag as any)("sales");

  return { success: true, count: importedCount }
}

/**
 * Bulk import expenses from CSV data.
 */
export async function importExpenses(csvContent: string, orgId: string) {
  const user = await authorize("Import Expenses", "admin", orgId)

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

  let importedCount = 0

  for (const record of records) {
    const category = record.category || record.Category || "Miscellaneous";
    const amount = parseFloat(record.amount || record.Amount || "0");
    const description = record.description || record.Description || "";
    const expense_date = record.expense_date || record.date || new Date().toISOString();

    if (amount <= 0) continue;

    await sql`
      INSERT INTO expenses (category, amount, description, expense_date, created_by, org_id)
      VALUES (${category}, ${amount}, ${description}, ${expense_date}, ${user.id}, ${orgId})
    `;
    importedCount++
  }

  await audit("Imported Expenses", "expense", orgId, { count: importedCount }, orgId);
  revalidatePath("/dashboard/reports", "page");
  (revalidateTag as any)(`reports-${orgId}`);

  return { success: true, count: importedCount }
}
