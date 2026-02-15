import { sql } from '../lib/db';

async function checkDb() {
    console.log('--- DB DIAGNOSTIC START ---');
    try {
        console.log('Checking profiles table...');
        const profiles = await sql`SELECT COUNT(*) FROM profiles`;
        console.log('Profiles count:', profiles[0].count);

        console.log('Checking organizations table...');
        const orgs = await sql`SELECT COUNT(*) FROM organizations`;
        console.log('Organizations count:', orgs[0].count);

        console.log('Checking profiles columns...');
        const profileCols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles'
        `;
        console.table(profileCols);

        console.log('DB Connection successful!');
    } catch (error) {
        console.error('DB Connection error:', error);
    }
    console.log('--- DB DIAGNOSTIC END ---');
}

checkDb();
