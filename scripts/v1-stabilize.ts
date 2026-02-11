import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function stabilizeDb(url: string, prefix: string) {
    console.log(`\n🚀 Stabilizing ${prefix} Database on: ${url.split('@')[1]}`);
    const sql = neon(url);
    const scriptsDir = path.join(process.cwd(), 'scripts');

    const files = [
        '011_add_min_stock.sql',
        '012_org_enhancements.sql',
        'sync-schema.sql',
        '014_add_org_id_to_audit_logs.sql',
        '015_add_gst_columns_to_sales.sql',
        '016_add_hsn_to_inventory.sql'
    ];

    console.log(`  📄 Ensuring profiles table has biometric_required...`);
    try {
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_required BOOLEAN DEFAULT false;`;
        console.log(`  ✓ profiles.biometric_required verified.`);
    } catch (e: any) {
        console.error(`  ❌ Error on profiles:`, e.message);
    }

    for (const file of files) {
        const filePath = path.join(scriptsDir, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`  ⚠️ Warning: ${file} not found, skipping.`);
            continue;
        }

        console.log(`  📄 Applying ${file}...`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Split by semicolon but handle DO $$ blocks
        const statements: string[] = [];
        let currentStatement = '';
        let inBlock = false;

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || (trimmedLine.startsWith('--') && !inBlock)) continue;

            if (trimmedLine.toUpperCase().includes('DO $$')) inBlock = true;

            currentStatement += line + '\n';

            if (!inBlock && trimmedLine.endsWith(';')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
            } else if (inBlock && trimmedLine.toUpperCase().endsWith('END $$;')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
                inBlock = false;
            }
        }
        if (currentStatement.trim()) statements.push(currentStatement.trim());

        for (const statement of statements) {
            try {
                // @ts-ignore
                await sql.query(statement);
            } catch (error: any) {
                if (error.message && (error.message.includes('already exists') || error.message.includes('already a column'))) {
                    // console.log(`    ℹ Skipped: (exists)`);
                } else {
                    console.error(`    ❌ Error:`, error.message);
                }
            }
        }
        console.log(`  ✓ ${file} applied/verified.`);
    }
}

async function run() {
    const primaryUrl = process.env.DATABASE_URL;
    const demoUrl = process.env.DEMO_DATABASE_URL;

    if (primaryUrl) {
        await stabilizeDb(primaryUrl, 'PRIMARY');
    } else {
        console.error('DATABASE_URL not found in .env.local');
    }

    if (demoUrl && demoUrl !== primaryUrl) {
        await stabilizeDb(demoUrl, 'DEMO');
    }
}

run().catch(console.error);
