
import { neon } from "@neondatabase/serverless";

const PROD_URL = "postgresql://neondb_owner:npg_7FuXMj5beQak@ep-restless-shadow-a1p24g3f-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const DEMO_URL = "postgresql://neondb_owner:npg_F7MWRjgITcP0@ep-frosty-breeze-ab3uwp82-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkSchema(name: string, url: string) {
    console.log(`\n=== Checking ${name} DB ===`);
    const sql = neon(url);

    try {
        console.log("--- Inventory Constraints ---");
        const constraints = await sql`
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conrelid = 'inventory'::regclass;
        `;
        console.log(JSON.stringify(constraints, null, 2));

        console.log("\n--- Inventory Columns ---");
        const invCols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'inventory';
        `;
        console.log(JSON.stringify(invCols, null, 2));

        console.log("\n--- Audit Logs Columns ---");
        const auditCols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'audit_logs';
        `;
        console.log(JSON.stringify(auditCols, null, 2));
    } catch (e: any) {
        console.error(`Error checking ${name}:`, e.message);
    }
}

async function run() {
    await checkSchema("Production", PROD_URL);
    await checkSchema("Demo", DEMO_URL);
}

run().catch(console.error);
