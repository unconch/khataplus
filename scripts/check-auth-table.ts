import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    try {
        console.log("Checking for auth.users table...");

        const tables = await sql`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'auth' AND table_name = 'users'
        `;

        console.log("Found tables:", tables);

        if (tables.length === 0) {
            console.log("CRITICAL: auth.users table does NOT exist in this database.");
            console.log("Conclusion: This database is likely separated from Supabase Auth.");
        } else {
            console.log("auth.users EXISTS. Proceeding with debugging permissions.");
        }

    } catch (error) {
        console.error("Error checking tables:", error);
    }
}

main();
