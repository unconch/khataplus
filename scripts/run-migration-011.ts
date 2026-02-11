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
        console.log("Applying min_stock migration...");
        const migration = fs.readFileSync(path.join(process.cwd(), 'scripts', '011_add_min_stock.sql'), 'utf8');

        const statements = migration
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            if (statement.startsWith('--')) continue;
            await sql([statement] as any);
        }

        console.log("Migration applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

main();
