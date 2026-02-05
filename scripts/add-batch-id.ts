import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        return;
    }
    const sql = neon(process.env.DATABASE_URL);

    console.log('Adding batch_id to sales table...');
    try {
        await sql`ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS batch_id UUID;`;
        console.log('Successfully added batch_id column.');
    } catch (e) {
        console.error('Error adding batch_id:', e);
    }
}

migrate();
