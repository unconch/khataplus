import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkConstraints() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL not found');
        return;
    }
    const sql = neon(url);

    console.log(`Checking constraints for organization_members...`);

    const result = await sql`
        SELECT
            conname AS constraint_name,
            pg_get_constraintdef(c.oid) AS constraint_definition
        FROM
            pg_constraint c
        JOIN
            pg_namespace n ON n.oid = c.connamespace
        WHERE
            contype = 'c' 
            AND conrelid = 'organization_members'::regclass;
    `;

    console.log('Constraints on organization_members table:');
    result.forEach((r: any) => {
        console.log(`${r.constraint_name}: ${r.constraint_definition}`);
    });
}

checkConstraints().catch(console.error);
