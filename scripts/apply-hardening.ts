import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function applyHardening() {
    console.log('🛡️ Starting Institutional Database Hardening...');
    const migrationPath = path.join(process.cwd(), 'scripts', 'db-hardening.sql');

    if (!fs.existsSync(migrationPath)) {
        console.error(`Migration file not found at ${migrationPath}`);
        process.exit(1);
    }

    const query = fs.readFileSync(migrationPath, 'utf8');

    try {
        console.log('Applying SQL blocks...');

        const queries: string[] = [];
        let currentQuery = "";
        let inDollarString = false;

        for (const line of query.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('-- BLOCK')) {
                if (currentQuery.trim()) queries.push(currentQuery.trim());
                currentQuery = "";
                continue;
            }
            if (line.includes('$$')) inDollarString = !inDollarString;
            currentQuery += line + "\n";

            if (!inDollarString && trimmed.endsWith(';')) {
                queries.push(currentQuery.trim());
                currentQuery = "";
            }
        }
        if (currentQuery.trim()) queries.push(currentQuery.trim());

        for (const q of queries) {
            if (q.startsWith('-- BLOCK')) continue;
            console.log(`Executing SQL: ${q.substring(0, 50).replace(/\n/g, ' ')}...`);
            await sql.query(q);
        }

        console.log('✅ Institutional Database Hardening applied successfully!');
    } catch (e) {
        console.error('❌ Hardening failed:', e);
    }
    process.exit(0);
}

applyHardening().catch(console.error);
