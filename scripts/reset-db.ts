import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function resetDb() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not set in .env.local');
        process.exit(1);
    }

    const sql = neon(url);

    console.log('--- Resetting Sales and Inventory Data ---');
    try {
        // We delete sales first because it references inventory
        console.log('Clearing sales table...');
        await sql`TRUNCATE TABLE sales CASCADE`;

        console.log('Clearing inventory table...');
        await sql`TRUNCATE TABLE inventory CASCADE`;

        console.log('Clearing related audit logs...');
        await sql`DELETE FROM audit_logs WHERE entity_type IN ('sales', 'inventory')`;

        console.log('SUCCESS: Sales and Inventory data reset successfully.');
    } catch (error) {
        console.error('FAILED to reset database:', error);
        process.exit(1);
    }
    console.log('--- Reset Complete ---');
}

resetDb();
