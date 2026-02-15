
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: npx tsx scripts/run-sql.ts <file.sql>');
        process.exit(1);
    }

    const migrationFile = args[0];
    const migrationPath = path.isAbsolute(migrationFile) ? migrationFile : path.join(process.cwd(), migrationFile);

    if (!fs.existsSync(migrationPath)) {
        console.error(`File not found: ${migrationPath}`);
        process.exit(1);
    }

    console.log(`Applying migration: ${migrationFile}`);
    const content = fs.readFileSync(migrationPath, 'utf8');

    // Split by custom separator or fallback to whole file
    const queries = content.split('-- STATEMENT_END').map(q => q.trim()).filter(q => q.length > 0);

    try {
        for (const query of queries) {
            console.log('Executing SQL block...');
            // Use .query method as requested by error message for raw strings
            // @ts-ignore
            await (sql as any).query(query, []);
        }
        console.log('✅ Migration applied successfully!');
    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    }
    process.exit(0);
}

main().catch(console.error);
