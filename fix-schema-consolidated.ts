import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixSchema() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }
    const sql = neon(url);
    try {
        console.log("Applying consolidated monetization schema fix...");

        const statements = [
            // 1. Add Add-on Flags
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS whatsapp_addon_active BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gst_addon_active BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS inventory_pro_active BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS vernacular_pack_active BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_forecast_active BOOLEAN DEFAULT FALSE`,

            // 2. Trial and Pioneer Tracking
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial'`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free'`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pioneer_status BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pioneer_joined_at TIMESTAMP WITH TIME ZONE`,
            `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pioneer_certificate_id TEXT`,

            // 3. Update existing records if needed
            `UPDATE organizations SET subscription_status = 'trial' WHERE subscription_status IS NULL`,
            `UPDATE organizations SET plan_type = 'free' WHERE plan_type IS NULL`,
            `UPDATE organizations SET trial_ends_at = (CURRENT_TIMESTAMP + INTERVAL '30 days') WHERE trial_ends_at IS NULL`
        ];

        for (const statement of statements) {
            console.log(`Executing: ${statement}...`);
            await (sql as any).query(statement);
        }

        console.log("Database schema fixed successfully!");
    } catch (err) {
        console.error("Schema fix failed:", err);
    } finally {
        process.exit();
    }
}

fixSchema();
