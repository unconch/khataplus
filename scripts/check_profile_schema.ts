
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log("Checking profiles table schema...");
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `;

        const hasBio = columns.some((c: any) => c.column_name === 'biometric_required');
        console.log("Columns found:", columns.map((c: any) => c.column_name));
        console.log(`Has 'biometric_required': ${hasBio}`);

        if (!hasBio) {
            console.error("CRITICAL: biometric_required column is MISSING!");
        } else {
            console.log("Schema looks correct.");
        }

    } catch (err) {
        console.error("Schema check failed:", err);
    }
}

main();
