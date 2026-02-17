import { sql } from "./lib/db";

async function checkSchema() {
    try {
        console.log("Checking organizations table schema...");
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'organizations'
            ORDER BY ordinal_position;
        `;
        console.log("Columns in 'organizations':");
        console.table(columns.map((c: any) => ({ name: c.column_name, type: c.data_type })));
    } catch (err) {
        console.error("Schema check failed:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
