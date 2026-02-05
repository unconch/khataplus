import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    console.log("Adding payment_method column to sales table...");
    try {
        await sql`
            ALTER TABLE sales 
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'Cash'
        `;
        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
