import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log("Migrating Admin Enhancement tables...");

    try {
        console.log("Creating/Verifying beta_waitlist...");
        await sql`
            CREATE TABLE IF NOT EXISTS beta_waitlist (
                id SERIAL PRIMARY KEY,
                name TEXT,
                email TEXT NOT NULL UNIQUE,
                platform TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log("Creating/Verifying system_announcements...");
        await sql`
            CREATE TABLE IF NOT EXISTS system_announcements (
                id SERIAL PRIMARY KEY,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE
            );
        `;

        console.log("Creating/Verifying hsn_master...");
        await sql`
            CREATE TABLE IF NOT EXISTS hsn_master (
                id SERIAL PRIMARY KEY,
                hsn_code TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL,
                gst_rate NUMERIC,
                chapter TEXT,
                is_popular BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log("Creating/Verifying marketing_campaigns...");
        await sql`
            CREATE TABLE IF NOT EXISTS marketing_campaigns (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                platforms TEXT[] DEFAULT '{}',
                status TEXT DEFAULT 'draft',
                scheduled_at TIMESTAMP WITH TIME ZONE,
                posted_at TIMESTAMP WITH TIME ZONE,
                media_url TEXT,
                metrics JSONB DEFAULT '{
                    "impressions": 0,
                    "clicks": 0,
                    "engagement": 0,
                    "spend": 0
                }'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log("✅ Admin Enhancement tables created successfully.");

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
