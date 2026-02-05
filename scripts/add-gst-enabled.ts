import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        return;
    }
    const sql = neon(process.env.DATABASE_URL);

    console.log('Adding gst_enabled to settings table...');
    try {
        await sql`ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS gst_enabled BOOLEAN DEFAULT TRUE;`;
        console.log('Successfully added gst_enabled column.');
    } catch (e) {
        console.error('Error adding gst_enabled:', e);
    }
}

migrate();
