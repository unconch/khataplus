import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function applyMigration() {
    console.log('Applying daily_reports migration...');
    const migrationPath = path.join(process.cwd(), 'scripts', '007_create_daily_reports.sql');
    const query = fs.readFileSync(migrationPath, 'utf8');

    try {
        const queries = query.split(';').filter(q => q.trim().length > 0);
        for (const q of queries) {
            await sql.query(q);
        }
        console.log('✅ Migration applied successfully!');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    }
    process.exit(0);
}

applyMigration().catch(console.error);
