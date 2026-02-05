import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(url);
    const migrationPath = path.join(process.cwd(), 'scripts', 'sync-schema.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('--- Applying Organization Enhancements Migration ---');
    try {
        // Split by semicolon but respect DO $$ blocks
        const statements: string[] = [];
        let currentStatement = '';
        let inBlock = false;

        const lines = migrationSql.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('--')) continue;

            if (trimmedLine.includes('DO $$')) inBlock = true;

            currentStatement += line + '\n';

            if (!inBlock && trimmedLine.endsWith(';')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
            } else if (inBlock && trimmedLine.endsWith('END $$;')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
                inBlock = false;
            }
        }
        if (currentStatement.trim()) statements.push(currentStatement.trim());

        for (const statement of statements) {
            console.log(`Executing:\n${statement}\n`);
            await sql.query(statement);
        }
        console.log('SUCCESS: Migration applied.');
    } catch (error) {
        console.error('FAILED to apply migration:', error);
        process.exit(1);
    }
}

applyMigration();
