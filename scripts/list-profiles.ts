import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    try {
        console.log("Listing all profiles...");
        const result = await sql`SELECT * FROM profiles ORDER BY created_at DESC`;
        console.log(`Found ${result.length} profiles.`);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error listing profiles:", error);
    }
}

main();
