import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyProfile() {
    const url = process.env.DATABASE_URL;
    if (!url) return;
    const sql = neon(url);

    console.log(`Verifying Profile BY ID on PRIMARY DB: ${url.split('@')[1]}`);

    const profiles = await sql`SELECT * FROM profiles WHERE id = 'user_39Oef0mJjKQ8EpCI8hQqjGyrI6e'`;
    console.log('Profiles found:', profiles.length);
    if (profiles.length > 0) {
        console.table(profiles);
    }
}

verifyProfile().catch(console.error);
