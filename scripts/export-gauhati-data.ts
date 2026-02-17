/**
 * Export all data from the Gauhati Cooperative Neon DB into an Excel file.
 * Usage: npx tsx scripts/export-gauhati-data.ts
 * Output: E:\repo\gauhati_cooperative_data.xlsx
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
    "postgresql://neondb_owner:npg_0YskXP8fSqWD@ep-fragrant-unit-a1610mql-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function exportAll() {
    console.log("🔗 Connecting to Gauhati Cooperative DB...");

    // Fetch all tables in parallel
    const [inventory, sales, profiles, expenses, reports, auditLogs, settings] =
        await Promise.all([
            sql`SELECT * FROM inventory ORDER BY name ASC`,
            sql`SELECT * FROM sales ORDER BY created_at DESC`,
            sql`SELECT * FROM profiles ORDER BY created_at DESC`,
            sql`SELECT * FROM expenses ORDER BY created_at DESC`.catch(() => []),
            sql`SELECT * FROM reports ORDER BY report_date DESC`.catch(() => []),
            sql`SELECT * FROM audit_logs ORDER BY created_at DESC`.catch(() => []),
            sql`SELECT * FROM settings`.catch(() => []),
        ]);

    console.log(`📦 Inventory: ${inventory.length} items`);
    console.log(`💰 Sales: ${sales.length} records`);
    console.log(`👥 Profiles: ${profiles.length} users`);
    console.log(`💸 Expenses: ${expenses.length} records`);
    console.log(`📊 Reports: ${reports.length} records`);
    console.log(`📝 Audit Logs: ${auditLogs.length} entries`);
    console.log(`⚙️  Settings: ${settings.length} records`);

    // Dynamically import xlsx
    const XLSX = (await import("xlsx")).default;

    // Create workbook
    const wb = XLSX.utils.book_new();

    function addSheet(name: string, data: any[]) {
        if (data.length === 0) {
            console.log(`⏭️  Skipping empty sheet: ${name}`);
            return;
        }
        // Specific mapping for Customers (from Gauhati Profiles)
        if (name === "Customers") {
            data = data.map((row: any) => ({
                name: row.name || row.email.split('@')[0], // Fallback to email username if name is missing
                phone: row.phone || row.email || "N/A", // Fallback to email if phone is missing
                address: row.address || "",
                created_at: row.created_at
            }));
        }

        // Flatten any nested objects/arrays to JSON strings for Excel compatibility
        const flattened = data.map((row: any) => {
            const flat: Record<string, any> = {};
            for (const [key, value] of Object.entries(row)) {
                if (value && typeof value === "object" && !(value instanceof Date)) {
                    flat[key] = JSON.stringify(value);
                } else {
                    flat[key] = value;
                }
            }
            return flat;
        });
        const ws = XLSX.utils.json_to_sheet(flattened);
        // Auto-width columns
        const colWidths = Object.keys(flattened[0]).map((key) => ({
            wch: Math.min(
                50,
                Math.max(
                    key.length + 2,
                    ...flattened
                        .slice(0, 50)
                        .map((r: any) => String(r[key] ?? "").length)
                )
            ),
        }));
        ws["!cols"] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, name);
    }

    addSheet("Inventory", inventory);
    addSheet("Sales", sales);
    addSheet("Customers", profiles); // Renamed from Profiles
    addSheet("Expenses", expenses);
    addSheet("Reports", reports); // KhataPlus expects Reports/Expenses
    addSheet("Ledger", auditLogs); // Renamed from Audit Logs
    addSheet("Settings", settings);

    const outputPath = "E:\\repo\\gauhati_cooperative_data.xlsx";
    XLSX.writeFile(wb, outputPath);

    console.log(`\n✅ Excel file saved to: ${outputPath}`);
    console.log(
        `📄 Sheets: ${wb.SheetNames.length} (${wb.SheetNames.join(", ")})`
    );
}

exportAll().catch((err) => {
    console.error("❌ Export failed:", err.message);
    process.exit(1);
});
