import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        return;
    }
    const sql = neon(process.env.DATABASE_URL);

    console.log('Adding gst_inclusive to settings table...');
    try {
        await sql`ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS gst_inclusive BOOLEAN DEFAULT FALSE;`;
        console.log('Successfully added gst_inclusive column.');
    } catch (e) {
        console.error('Error adding gst_inclusive:', e);
    }
}

migrate();
