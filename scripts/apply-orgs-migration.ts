import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function applyOrgsMigration() {
    console.log('Applying organizations migration...');

    try {
        // Create organizations table
        await sql`
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                created_by TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✓ organizations table created');

        // Create index
        await sql`CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug)`;
        console.log('✓ organizations index created');

        // Create organization_members table
        await sql`
            CREATE TABLE IF NOT EXISTS organization_members (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'owner')) DEFAULT 'staff',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(org_id, user_id)
            )
        `;
        console.log('✓ organization_members table created');

        await sql`CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id)`;
        console.log('✓ organization_members indexes created');

        // Create organization_invites table
        await sql`
            CREATE TABLE IF NOT EXISTS organization_invites (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'staff',
                token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                accepted_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✓ organization_invites table created');

        await sql`CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email)`;
        console.log('✓ organization_invites indexes created');

        // Add org_id to existing tables
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id)`;
        await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id)`;
        await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id)`;
        await sql`ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id)`;
        await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id)`;
        await sql`ALTER TABLE khata_transactions ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id)`;
        console.log('✓ org_id columns added to data tables');

        // Create indexes for org_id
        await sql`CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(org_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(org_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(org_id)`;
        console.log('✓ org_id indexes created');

        console.log('✅ Organizations migration complete');
    } catch (e: any) {
        console.error('Migration error:', e.message);
    }

    process.exit(0);
}

applyOrgsMigration();
