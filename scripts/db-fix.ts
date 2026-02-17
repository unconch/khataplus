
import { neon } from "@neondatabase/serverless";

const PROD_URL = "postgresql://neondb_owner:npg_7FuXMj5beQak@ep-restless-shadow-a1p24g3f-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const DEMO_URL = "postgresql://neondb_owner:npg_F7MWRjgITcP0@ep-frosty-breeze-ab3uwp82-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function fixDB(name: string, url: string) {
    console.log(`\n=== Fixing ${name} DB ===`);
    const sql = neon(url);

    try {
        console.log("1. Adding 'sell_price' and 'min_stock' columns if missing...");
        await sql`
            ALTER TABLE inventory 
            ADD COLUMN IF NOT EXISTS sell_price NUMERIC DEFAULT 0,
            ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
        `;

        console.log("2. Cleaning up duplicate SKUs per org before adding unique constraint...");
        // This is a safety measure: if there are already duplicates, the index creation will fail.
        // We keep the newest one for each (sku, org_id).
        await sql`
            DELETE FROM inventory a USING inventory b
            WHERE a.id < b.id 
            AND a.sku = b.sku 
            AND a.org_id = b.org_id;
        `;

        console.log("3. Creating/Updating Unique Constraint...");
        // Drop old non-tenant-aware index if it exists
        try {
            await sql`ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_sku_key;`;
        } catch (e) {
            console.log("Note: inventory_sku_key constraint not found or already dropped.");
        }

        await sql`
            CREATE UNIQUE INDEX IF NOT EXISTS inventory_sku_org_unique 
            ON inventory(sku, org_id);
        `;

        console.log("4. Verifying Audit Logs Table...");
        await sql`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id TEXT,
                details JSONB,
                org_id UUID NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        console.log(`✅ ${name} DB Fixes completed.`);
    } catch (e: any) {
        console.error(`❌ Error fixing ${name}:`, e.message);
        throw e;
    }
}

async function run() {
    await fixDB("Production", PROD_URL);
    await fixDB("Demo", DEMO_URL);
}

run().catch(console.error);
