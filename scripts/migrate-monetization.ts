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
    console.log("Starting Monetization & GST Schema Migration...");
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();

        const schemaPath = path.join(process.cwd(), 'lib', 'monetization-schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Applying schema...");
        await client.query(schemaSql);

        console.log("✅ Schema applied successfully.");

        // Verification
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name IN ('plan_type', 'credits_whatsapp');
        `);

        console.log("Verified new columns in 'organizations':", res.rows.map((c: any) => c.column_name));

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
