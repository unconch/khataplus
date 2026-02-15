
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkSchema() {
    try {
        console.log("Checking tables...");
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Tables found:", tables.map(t => t.table_name).join(", "));

        for (const table of ['profiles', 'organization_members', 'audit_logs', 'sales', 'organizations']) {
            const exists = tables.find(t => t.table_name === table);
            if (exists) {
                console.log(`Checking columns for ${table}...`);
                const columns = await sql`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = ${table}
                `;
                console.log(`Columns in ${table}:`, columns.map(c => `${c.column_name} (${c.data_type})`).join(", "));
            } else {
                console.warn(`WARNING: Table ${table} NOT FOUND!`);
            }
        }
    } catch (err) {
        console.error("Diagnostic failed:", err);
    }
}

checkSchema();
