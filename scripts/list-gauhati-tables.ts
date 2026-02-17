/**
 * Utility to list all tables in the Gauhati Cooperative DB.
 */
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_0YskXP8fSqWD@ep-fragrant-unit-a1610mql-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function listTables() {
    console.log("🔍 Checking Gauhati DB tables...");
    const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `;
    console.log("Tables found:", tables.map(t => t.table_name).join(", "));
}

listTables().catch(err => console.error(err));
