
import { sql } from '@/lib/db-standalone';

async function migrate() {
    console.log("Starting migration: Admin -> Owner...");

    try {
        // 1. Update organization_members
        const result = await sql`
            UPDATE organization_members
            SET role = 'owner'
            WHERE role = 'admin'
            RETURNING *
        `;
        console.log(`Updated ${result.length} members to 'owner'.`);

        // 2. Update organization_invites (if any pending invites exist)
        const invites = await sql`
            UPDATE organization_invites
            SET role = 'owner'
            WHERE role = 'admin'
            RETURNING *
        `;
        console.log(`Updated ${invites.length} pending invites to 'owner'.`);

        // 3. Update profiles (Main Admin -> Owner)
        const profiles = await sql`
            UPDATE profiles
            SET role = 'owner'
            WHERE role = 'main admin'
            RETURNING *
        `;
        console.log(`Updated ${profiles.length} profiles from 'main admin' to 'owner'.`);

        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
