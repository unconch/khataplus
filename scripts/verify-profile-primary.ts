import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyProfile() {
    const url = process.env.DATABASE_URL;
    if (!url) return;
    const sql = neon(url);

    console.log(`Verifying Profile on PRIMARY DB: ${url.split('@')[1]}`);

    const profiles = await sql`SELECT * FROM profiles WHERE email = 'unizames@gmail.com'`;
    console.log('Profiles found:', profiles.length);
    if (profiles.length > 0) {
        console.table(profiles);
    }
}

verifyProfile().catch(console.error);
