import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('Error: DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(url);
    const scriptsDir = path.join(process.cwd(), 'scripts');
    const filePath = path.join(scriptsDir, '011_add_min_stock.sql');

    console.log(`🚀 Applying migration on: ${url.split('@')[1]}`);
    const content = fs.readFileSync(filePath, 'utf8');

    const statements = content
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        try {
            // @ts-ignore
            await sql.query(statement);
            console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
        } catch (error: any) {
            if (error.message && (error.message.includes('already exists') || error.message.includes('already a column'))) {
                console.log(`ℹ Skipped (already exists): ${statement.substring(0, 50)}...`);
            } else {
                console.error(`❌ Error executing statement:`, error.message);
            }
        }
    }
}

applyMigration().catch(console.error);
