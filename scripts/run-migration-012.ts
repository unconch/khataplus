import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runMigration() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL not found');
        return;
    }
    const sql = neon(url);

    console.log(`Updating role constraint for organization_members...`);

    await sql`
        ALTER TABLE organization_members 
        DROP CONSTRAINT organization_members_role_check,
        ADD CONSTRAINT organization_members_role_check 
        CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text, 'owner'::text]));
    `;

    console.log('Migration completed successfully.');
}

runMigration().catch(console.error);
