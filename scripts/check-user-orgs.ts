import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

const affectedUserIds = [
    '839f274f-f55b-4db3-a191-c4f50040cd41',
    'bed83bce-913e-40dd-a839-1f4c6965d795',
    'c737253d-37c6-42fe-a7e5-9dd44d479964',
    '051ca2b3-22ba-4d9f-894b-14e45433e491'
];

async function main() {
    try {
        console.log("Checking organizations for affected users...");
        for (const userId of affectedUserIds) {
            const orgs = await sql`
                SELECT o.name, o.slug, o.phone as org_phone
                FROM organization_members om
                JOIN organizations o ON om.org_id = o.id
                WHERE om.user_id = ${userId}
            `;

            const profile = await sql`SELECT email, name, phone FROM profiles WHERE id = ${userId}`;

            console.log(`\nUser: ${profile[0]?.email} (${profile[0]?.name})`);
            console.log(`Profile Phone: ${profile[0]?.phone}`);

            if (orgs.length > 0) {
                console.log(`Has ${orgs.length} organizations:`);
                console.log(JSON.stringify(orgs, null, 2));
            } else {
                console.log("No organizations found (User likely stuck in onboarding).");
            }
        }
    } catch (error) {
        console.error("Error checking user orgs:", error);
    }
}

main();
