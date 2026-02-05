import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

/**
 * Institutional Disaster Recovery Export
 * Generates an UNENCRYPTED Raw SQL dump for rapid accessibility.
 */
async function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const backupPath = path.join(backupDir, `institutional-dump-${timestamp}.sql`);

    console.log(`📦 Starting institutional backup to ${backupPath}...`);

    try {
        const tables = ['profiles', 'settings', 'inventory', 'sales', 'daily_reports', 'audit_logs', 'expenses', 'expense_categories', 'returns'];
        let fullDump = `-- KhataPlus Institutional Backup\n-- Date: ${new Date().toISOString()}\n\n`;

        for (const table of tables) {
            console.log(`Exporting table: ${table}...`);
            const data = await sql.query(`SELECT * FROM ${table}`);

            if (data.rows.length === 0) {
                fullDump += `-- Table ${table} is empty\n\n`;
                continue;
            }

            fullDump += `-- Table: ${table}\n`;
            fullDump += `TRUNCATE TABLE ${table} CASCADE;\n`;

            const columns = Object.keys(data.rows[0]);
            for (const row of data.rows) {
                const values = columns.map(col => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                    if (val instanceof Date) return `'${val.toISOString()}'`;
                    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                    return val;
                });
                fullDump += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            fullDump += `\n`;
        }

        fs.writeFileSync(backupPath, fullDump);
        console.log(`✅ Backup complete! institutional-dump-${timestamp}.sql generated.`);
        console.log(`⚠️  PROTECTION NOTICE: This file is UNENCRYPTED as per safety requirements. Store in a physically secure off-site location.`);
    } catch (e) {
        console.error('❌ Backup failed:', e);
    }
    process.exit(0);
}

runBackup().catch(console.error);
