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

async function runMigration() {
    console.log('Running SaaS Audit Log migration...');
    const migrationPath = path.join(process.cwd(), 'scripts', '014_add_org_id_to_audit_logs.sql');
    const query = fs.readFileSync(migrationPath, 'utf8');

    try {
        const queries = query.split(';').filter(q => q.trim().length > 0);
        for (const q of queries) {
            console.log(`Executing: ${q.substring(0, 50)}...`);
            await sql.query(q);
        }
        console.log('✅ SaaS Audit Log migration applied successfully!');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    }
    process.exit(0);
}

runMigration().catch(console.error);
