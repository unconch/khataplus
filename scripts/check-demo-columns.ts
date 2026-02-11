import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkColumns() {
    const url = process.env.DEMO_DATABASE_URL;
    if (!url) return;
    const sql = neon(url);

    console.log(`Checking DEMO DB: ${url.split('@')[1]}`);

    const result = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles'
    `;

    console.log('Columns in profiles table (DEMO):');
    console.log(result.map((r: any) => r.column_name).join(', '));
}

checkColumns().catch(console.error);
