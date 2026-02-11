import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function initDemoDb() {
    const url = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;
    if (!url) {
        console.error('Error: DEMO_DATABASE_URL or DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(url);
    const scriptsDir = path.join(process.cwd(), 'scripts');

    // List of SQL files to run in order
    const sqlFiles = [
        'schema.sql', // Base
        '004_profile_trigger.sql',
        '005_stock_update_trigger.sql',
        '008_features_update.sql',
        '009_create_customers.sql',
        '010_create_organizations.sql',
        '011_create_suppliers.sql',
        '012_org_enhancements.sql',
        '013_fix_daily_reports_unique.sql',
        '014_add_org_id_to_audit_logs.sql',
        '015_add_gst_columns_to_sales.sql',
        '016_add_hsn_to_inventory.sql'
    ];

    console.log(`🚀 Starting Full Database Initialization on: ${url.split('@')[1]}`);

    for (const file of sqlFiles) {
        const filePath = path.join(scriptsDir, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Warning: ${file} not found, skipping.`);
            continue;
        }

        console.log(`📄 Applying ${file}...`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Split by semicolon and run each statement to avoid "multiple commands in prepared statement" error
        const statements = content
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                // @ts-ignore
                await sql.query(statement);
            } catch (error: any) {
                // Ignore "already exists" errors to make it idempotent
                if (error.message && (error.message.includes('already exists') || error.message.includes('already a column'))) {
                    // Skip silently
                } else {
                    console.error(`❌ Error in ${file} statement:`, statement.substring(0, 50) + '...');
                    console.error(error.message);
                }
            }
        }
        console.log(`✓ ${file} applied.`);
    }

    console.log('✅ Database Initialization Complete.');
}

initDemoDb().catch(console.error);
