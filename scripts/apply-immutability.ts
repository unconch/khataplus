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
    console.log("Starting Immutability Trigger Deployment...");
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();

        const sqlPath = path.join(process.cwd(), 'scripts', 'deploy-immutability.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Applying Immutability Triggers to 'sales' and 'audit_logs'...");
        await client.query(sql);

        console.log("✅ Immutability Triggers deployed successfully.");

        // Verification: Check if triggers exist
        const res = await client.query(`
            SELECT trigger_name 
            FROM information_schema.triggers 
            WHERE event_object_table IN ('sales', 'audit_logs')
            AND trigger_name IN ('trg_enforce_sales_immutability', 'trg_enforce_audit_immutability');
        `);

        console.log("Verified Triggers:", res.rows.map((t: any) => t.trigger_name));

    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
