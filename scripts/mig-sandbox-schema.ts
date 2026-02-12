import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const url = process.env.DEMO_DATABASE_URL;
    if (!url) {
        console.log('No demo');
        process.exit(1);
    }
    const sql = neon(url);
    console.log('Checking schema...');
    try {
        await sql`ALTER TABLE khata_transactions ADD COLUMN IF NOT EXISTS org_id TEXT DEFAULT 'demo-org'`;
        console.log('✓ Added org_id to khata_transactions');
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS org_id TEXT DEFAULT 'demo-org'`;
        console.log('✓ Added org_id to customers');
        await sql`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS org_id TEXT DEFAULT 'demo-org'`;
        console.log('✓ Added org_id to suppliers');
    } catch (e) {
        console.error('Migration failed:', e);
    }
    process.exit(0);
}

run();
