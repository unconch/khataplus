import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;
const sql = neon(connectionString!);

async function applySuppliersMigration() {
    console.log('Applying suppliers migration...');

    try {
        // Suppliers table
        await sql`
            CREATE TABLE IF NOT EXISTS suppliers (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                email TEXT,
                address TEXT,
                gstin TEXT,
                org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                UNIQUE(phone, org_id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✓ suppliers table created');

        // Supplier Transactions table
        await sql`
            CREATE TABLE IF NOT EXISTS supplier_transactions (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
                type TEXT NOT NULL, -- 'purchase' (credit) or 'payment' (debit)
                amount DECIMAL(12, 2) NOT NULL,
                note TEXT,
                created_by TEXT,
                org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✓ supplier_transactions table created');

        // Indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON suppliers(org_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_supplier_tx_supplier_id ON supplier_transactions(supplier_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_supplier_tx_org_id ON supplier_transactions(org_id)`;
        console.log('✓ indexes created');

        console.log('✅ Suppliers migration complete');
    } catch (e: any) {
        console.error('Migration error:', e.message);
        process.exit(1);
    }

    process.exit(0);
}

applySuppliersMigration();
