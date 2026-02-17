import { Client } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

async function main() {
    console.log("Starting V2 Migration Deployment...");
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();

        const sqlPath = path.join(process.cwd(), 'lib', 'migrations', '2026_v2_updates.sql');
        let sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Add auto_reminders_enabled and upi_id column checks
        sqlContent += `\nALTER TABLE organizations ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT FALSE;`;
        sqlContent += `\nALTER TABLE organizations ADD COLUMN IF NOT EXISTS upi_id TEXT;`;

        console.log("Applying V2 Enhancements to 'sales' and 'organizations' tables...");
        await client.query(sqlContent);

        console.log("✅ V2 Migration deployed successfully.");

        // Verification: Check if columns exist
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'sales' 
            AND column_name IN ('customer_name', 'customer_phone', 'payment_link', 'payment_status');
        `);

        console.log("Verified Columns:", res.rows.map((r: any) => r.column_name));

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
