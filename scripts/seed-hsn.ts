import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { hsnMasterData } from '../lib/hsn-master';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log(`Seeding HSN Master Data: ${hsnMasterData.length} items...`);

    try {
        let itemsAdded = 0;

        for (const item of hsnMasterData) {
            await sql`
                INSERT INTO hsn_master (hsn_code, description, gst_rate, chapter, is_popular)
                VALUES (${item.code}, ${item.name}, ${item.rate}, ${item.chapter}, false)
                ON CONFLICT (hsn_code) DO NOTHING
            `;
            itemsAdded++;
            if (itemsAdded % 50 === 0) console.log(`Processed ${itemsAdded} items...`);
        }

        console.log(`✅ HSN Seed complete. Total items processed: ${itemsAdded}`);

    } catch (error) {
        console.error("HSN Seeding failed:", error);
        process.exit(1);
    }
}

main();
