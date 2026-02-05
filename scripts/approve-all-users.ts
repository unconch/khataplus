import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function approveAllUsers() {
    try {
        await sql`UPDATE profiles SET status = 'approved', role = 'owner' WHERE status = 'pending'`;
        console.log('✅ All pending users approved as owners');
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

approveAllUsers();
