import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString!);

async function applyCustomersMigration() {
    console.log('Applying customers migration...');

    try {
        // Customers table
        await sql`
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                address TEXT,
                org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✓ customers table created');

        // Khata Transactions table
        await sql`
            CREATE TABLE IF NOT EXISTS khata_transactions (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
                amount DECIMAL(12,2) NOT NULL,
                sale_id TEXT, -- Optional link to a specific sale
                note TEXT,
                created_by TEXT, -- user_id who created this
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✓ khata_transactions table created');

        // Indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_khata_customer ON khata_transactions(customer_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_khata_created_at ON khata_transactions(created_at)`;
        console.log('✓ indexes created');

        console.log('✅ Customers migration complete');
    } catch (e: any) {
        console.error('Migration error:', e.message);
    }

    process.exit(0);
}

applyCustomersMigration();
