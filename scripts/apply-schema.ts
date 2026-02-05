
import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applySchema() {
    try {
        const schema = fs.readFileSync(path.join(process.cwd(), 'scripts', 'schema.sql'), 'utf8');
        console.log('Applying schema...');

        await pool.query(schema);

        console.log('✅ Schema applied successfully');
    } catch (e) {
        console.error('❌ Failed to apply schema:', e);
    } finally {
        await pool.end();
    }
}

applySchema();
