import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkColumns() {
    const url = process.env.DATABASE_URL;
    if (!url) return;
    const sql = neon(url);

    console.log(`Checking DB: ${url.split('@')[1]}`);

    const tableName = process.argv[2] || 'organizations';

    const result = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
    `;

    console.log(`Columns in ${tableName} table:`);
    console.log(result.map((r: any) => r.column_name).join(', '));
}

checkColumns().catch(console.error);
