import { getProductionSql, getDemoSql } from "./lib/db";
import dotenv from "dotenv";

dotenv.config();

async function runMigration() {
    const targets = [];

    if (process.env.DATABASE_URL) targets.push({ name: "Production", getClient: getProductionSql });
    if (process.env.DEMO_DATABASE_URL) targets.push({ name: "Demo", getClient: getDemoSql });

    if (targets.length === 0) {
        console.error("No database URLs found in .env");
        process.exit(1);
    }

    for (const target of targets) {
        try {
            console.log(`\n[${target.name}] Starting migration...`);
            const sql = target.getClient();

            // 1. Add status column
            console.log(`[${target.name}] Adding 'status' column...`);
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;

            // 2. Update NULLs
            console.log(`[${target.name}] Seeding 'active' status for existing records...`);
            await sql`UPDATE profiles SET status = 'active' WHERE status IS NULL`;

            // 3. Set NOT NULL
            console.log(`[${target.name}] Applying NOT NULL constraint...`);
            await sql`ALTER TABLE profiles ALTER COLUMN status SET NOT NULL`;

            console.log(`[${target.name}] Migration SUCCESSFUL`);
        } catch (error) {
            console.error(`[${target.name}] Migration FAILED:`, error);
        }
    }
    console.log("\nAll migrations attempted.");
    process.exit(0);
}

runMigration();
