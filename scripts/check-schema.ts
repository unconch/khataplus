import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const url = process.env.DEMO_DATABASE_URL;
    if (!url) return;
    const sql = neon(url);

    console.log(`Checking SCHEMA on DEMO DB: ${url.split('@')[1]}`);

    const searchPath = await sql`SHOW search_path`;
    console.log('Search Path:', searchPath[0].search_path);

    const tables = await sql`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'profiles'
    `;
    console.log('Profiles table locations:');
    console.table(tables);

    const columns = await sql`
        SELECT table_schema, column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'biometric_required'
    `;
    console.log('biometric_required column locations:');
    console.table(columns);
}

checkSchema().catch(console.error);
