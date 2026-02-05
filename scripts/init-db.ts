import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function initDb() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('Error: DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(url);
    const schemaPath = path.join(process.cwd(), 'scripts', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Initializing database schema...');

    try {
        // Neon requires tagged templates for the primary sql function
        // We'll use a hack to pass a raw string or use the query method if available
        // Actually, let's just use the query method if possible, or build a template
        await sql.query(schemaSql);
        console.log('Schema executed successfully.');
    } catch (error) {
        console.error('Error executing schema with sql.query:', error);

        // Fallback to statement by statement if large block fails
        console.log('Attempting statement by statement execution...');
        const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                // @ts-ignore
                await sql.query(statement);
                console.log('Executed statement successfully.');
            } catch (stmtError) {
                console.error('Error executing statement:', statement);
                console.error(stmtError);
            }
        }
    }

    console.log('Database initialization complete.');
}

initDb().catch(console.error);
