import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }
    const sql = neon(url);
    try {
        console.log("=== ORGANIZATIONS TABLE ===");
        const orgCols = await sql`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'organizations'
            ORDER BY ordinal_position;
        `;
        orgCols.forEach((c: any) => console.log(`  ${c.column_name} (${c.data_type}) default=${c.column_default || 'none'}`));

        console.log("\n=== PROFILES TABLE ===");
        const profCols = await sql`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles'
            ORDER BY ordinal_position;
        `;
        profCols.forEach((c: any) => console.log(`  ${c.column_name} (${c.data_type}) default=${c.column_default || 'none'}`));

        console.log("\n=== ALL TABLES ===");
        const tables = await sql`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;
        tables.forEach((t: any) => console.log(`  ${t.table_name}`));

    } catch (err) {
        console.error("Schema check failed:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
