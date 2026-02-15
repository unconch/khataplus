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
    console.log("Starting WebAuthn Schema Deployment...");
    const client = new Client(process.env.DATABASE_URL);

    try {
        await client.connect();

        const sqlPath = path.join(process.cwd(), 'scripts', 'deploy-webauthn.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Creating 'webauthn_credentials' table...");
        await client.query(sql);

        console.log("✅ WebAuthn schema deployed successfully.");

    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
