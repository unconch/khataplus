
import { neon } from '@neondatabase/serverless';
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function runMigration() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not defined in .env.local");
        }

        // Connect directly without using lib/db.ts
        const sql = neon(process.env.DATABASE_URL);

        console.log("Applying migration: 015_add_gst_columns_to_sales.sql");
        console.log("---------------------------------------------------");

        // 1. Add Columns
        console.log("Adding columns customer_gstin and hsn_code...");
        await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(20)`;
        await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10)`;

        // 2. Add Index
        console.log("Adding index idx_sales_customer_gstin...");
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_customer_gstin ON sales(customer_gstin)`;

        console.log("✅ Migration applied successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
