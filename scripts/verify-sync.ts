import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    try {
        console.log("Verifying Sync Trigger...");

        // Debugging permissions
        const userRes = await sql`SELECT current_user, session_user`;
        console.log("Current User:", userRes[0]);

        const schemas = await sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'`;
        console.log("Auth Schema Visible:", schemas.length > 0);

        // Pick a test user (e.g., the first one)
        const profiles = await sql`SELECT id, name FROM profiles LIMIT 1`;
        if (profiles.length === 0) {
            console.log("No profiles found to text sync.");
            return;
        }

        const user = profiles[0];
        const newName = `${user.name} (Sync Verify)`;

        console.log(`Updating profile for ${user.id}...`);

        // Update the profile to trigger the sync
        await sql`UPDATE profiles SET name = ${newName} WHERE id = ${user.id}`;

        console.log("Update executed. Check Supabase Auth dashboard or query auth.users if possible.");

        // Revert change
        console.log("Reverting name change...");
        await sql`UPDATE profiles SET name = ${user.name} WHERE id = ${user.id}`;
        console.log("Revert complete.");

    } catch (error) {
        console.error("Error verifying sync:", error);
    }
}

main();
