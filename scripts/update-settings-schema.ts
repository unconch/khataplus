import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function updateSchema() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(url);

    console.log('--- Updating settings schema ---');
    try {
        await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS gst_inclusive BOOLEAN NOT NULL DEFAULT FALSE`;
        console.log('SUCCESS: Column gst_inclusive added to settings.');
    } catch (error) {
        console.error('FAILED to update schema:', error);
        process.exit(1);
    }
}

updateSchema();
