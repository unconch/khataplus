import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log("Migrating pSEO tables...");

    try {
        // Inlining SQL to satisfy tagged template requirement
        await sql`
            CREATE TABLE IF NOT EXISTS pseo_cities (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                slug TEXT NOT NULL UNIQUE,
                tier TEXT DEFAULT '2',
                enabled BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS pseo_categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                slug TEXT NOT NULL UNIQUE,
                priority INTEGER DEFAULT 0,
                enabled BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log("✅ pSEO tables created successfully.");

        // Verification
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('pseo_cities', 'pseo_categories');
        `;

        console.log("Verified tables:", tables.map((t: any) => t.table_name));

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
