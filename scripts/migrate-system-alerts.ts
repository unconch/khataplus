import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    const urls = [
        { name: 'Production', url: process.env.DATABASE_URL },
        { name: 'Demo/Sandbox', url: process.env.DEMO_DATABASE_URL }
    ];

    for (const { name, url } of urls) {
        if (!url) {
            console.warn(`[Migration] Skipping ${name}: URL not found in environment`);
            continue;
        }

        console.log(`[Migration] Running on ${name} database...`);
        const sql = neon(url);

        try {
            await sql`
                CREATE TABLE IF NOT EXISTS system_alerts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    message TEXT NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
            console.log(`[Migration] Success for ${name}`);
        } catch (err: any) {
            console.error(`[Migration] Failed for ${name}:`, err.message);
        }
    }
    process.exit(0);
}

migrate();
