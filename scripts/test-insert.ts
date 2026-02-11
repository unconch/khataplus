import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testInsert() {
    const url = process.env.DEMO_DATABASE_URL;
    if (!url) return;
    const sql = neon(url);

    console.log(`Testing Insert on DEMO DB: ${url.split('@')[1]}`);

    try {
        const clerkUserId = 'test-user-' + Date.now();
        const email = 'test@example.com';
        const name = 'Test User';

        const result = await sql`
            INSERT INTO profiles (id, email, name, role, status, biometric_required) 
            VALUES (${clerkUserId}, ${email}, ${name}, 'staff', 'pending', false)
            RETURNING *
        `;
        console.log('✓ Success! Inserted:', result[0].id);
    } catch (e: any) {
        console.error('❌ Insertion failed:', e.message);
        console.error('Error Details:', JSON.stringify(e, null, 2));
    }
}

testInsert().catch(console.error);
