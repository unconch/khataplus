import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log("Applying features update migration...");
        const migration = fs.readFileSync(path.join(process.cwd(), 'scripts', '008_features_update.sql'), 'utf8');

        // Split by semicolon to execute statements individually if needed, 
        // but neon driver can often handle multiple statements. 
        // For safety with some drivers, splitting is often better, 
        // but here we'll try executing as one block first.
        // If it fails, we might need a more robust migration runner.
        // For simple SQL scripts without transactions, this usually works.

        // However, the neon driver (and postgres in general) supports multi-statement queries.
        // We just need to be careful about transaction blocks.

        // Let's try executing commands one by one to be safe and get better error reporting.
        const statements = migration
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            if (statement.startsWith('--')) continue; // specific comment skipping if mostly comments
            // Basic execution
            await sql(statement);
        }

        console.log("Migration applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

main();
