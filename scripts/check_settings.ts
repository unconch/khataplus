
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
        console.log("Fetching system settings...");
        const settings = await sql`SELECT * FROM settings WHERE id = 'default'`;

        if (settings.length === 0) {
            console.log("No settings found for 'default'.");
        } else {
            console.log("Settings found:", settings[0]);
            console.log(`GST Enabled: ${settings[0].gst_enabled}`);
        }

    } catch (err) {
        console.error("Failed to check settings:", err);
    }
}

main();
