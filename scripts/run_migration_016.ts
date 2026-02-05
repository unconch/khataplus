
import { neon } from '@neondatabase/serverless';
import fs from "fs";
import path from "path";
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

        console.log("Applying migration: 016_add_hsn_to_inventory.sql");
        console.log("---------------------------------------------------");

        // Execute directly using tagged template since it's a simple safe statement
        console.log("Adding hsn_code to inventory...");
        await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10)`;

        console.log("✅ Migration applied successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
