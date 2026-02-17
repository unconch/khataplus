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
        console.log("Checking organizations table schema...");
        const columns = await (sql as any).query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'organizations'
            ORDER BY ordinal_position;
        `);
        console.log("Columns in 'organizations':");
        // @ts-ignore - neon returns an array of rows directly or a result object depending on usage
        const rows = Array.isArray(columns) ? columns : (columns.rows || []);
        console.table(rows.map((c: any) => ({ name: c.column_name, type: c.data_type })));
    } catch (err) {
        console.error("Schema check failed:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
