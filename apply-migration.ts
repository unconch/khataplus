import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found in .env.local");
        process.exit(1);
    }

    const sql = neon(url);
    const migrationPath = path.join(process.cwd(), 'lib', 'migrations', '2026_monetization_update.sql');

    try {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        console.log("Applying migration...");

        // The neon client doesn't support multiple statements in one call easily if they are complex,
        // but for simple ALTER/UPDATE it should work if we pass it as a raw string.
        // Or we can split by semicolon.
        // Simple split by semicolon. Real SQL parsing is harder, but this works for simple migrations.
        const statements = migrationSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n'))
            .filter(s => s.trim().length > 0);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
            await (sql as any).query(statement);
        }

        console.log("Migration applied successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

applyMigration();
