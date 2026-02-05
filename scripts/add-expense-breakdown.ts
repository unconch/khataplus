
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
    console.log('Starting migration...');
    try {
        await sql`ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS expense_breakdown JSONB;`;
        console.log('Migration successful: Added expense_breakdown column to daily_reports.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
