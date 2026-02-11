import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
    const url = process.env.DEMO_DATABASE_URL!;
    const sql = neon(url);
    console.log(`Checking Demo DB: ${url.split('@')[1]}`);
    const res = await sql`SELECT * FROM profiles`;
    console.table(res);
}
run().catch(console.error);
