"use server"

import { parse } from "csv-parse/sync"
import { authorize } from "./security"

const MAX_CSV_SIZE = 2 * 1024 * 1024; // Increased to 2MB for robust migrations

/**
 * Helper to parse CSV content and delegate to the smart migration engine.
 */
async function delegateImport(
  csvContent: string,
  orgId: string,
  importFnName: "importInventory" | "importCustomers" | "importSuppliers" | "importSales" | "importExpenses",
  authLabel: string
) {
  if (csvContent.length > MAX_CSV_SIZE) {
    throw new Error("CSV file too large (Max 2MB allowed)");
  }

  // Basic parsing to get records
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  }) as any[]

  if (records.length === 0) {
    throw new Error("No valid records found in CSV");
  }

  // Import the smart migration engine
  const migration = await import("./data/migration");
  const fn = migration[importFnName] as any;

  if (typeof fn !== "function") {
    throw new Error(`Import logic for ${importFnName} is not implemented in migration engine.`);
  }

  // Execute the smart logic
  return await fn(orgId, records);
}

/**
 * Smart Inventory Import
 */
export async function importInventory(csvContent: string, orgId: string) {
  return await delegateImport(csvContent, orgId, "importInventory", "Import Inventory");
}

/**
 * Smart Customer Import
 */
export async function importCustomers(csvContent: string, orgId: string) {
  return await delegateImport(csvContent, orgId, "importCustomers", "Import Customers");
}

/**
 * Smart Supplier Import
 */
export async function importSuppliers(csvContent: string, orgId: string) {
  return await delegateImport(csvContent, orgId, "importSuppliers", "Import Suppliers");
}

/**
 * Smart Sales Import
 */
export async function importSales(csvContent: string, orgId: string) {
  return await delegateImport(csvContent, orgId, "importSales", "Import Sales");
}

/**
 * Smart Expense Import
 */
export async function importExpenses(csvContent: string, orgId: string) {
  return await delegateImport(csvContent, orgId, "importExpenses", "Import Expenses");
}
