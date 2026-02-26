import { sql } from "../db";

function quoteIdent(name: string) {
    return '"' + name.replace(/"/g, '""') + '"';
}

/**
 * Initializes a new isolated schema for an organization and creates all necessary tables.
 * This ensures data isolation while maintaining a consistent structure across all tenants.
 */
export async function initializeOrganizationSchema(orgId: string): Promise<void> {
    const schemaName = `org_${orgId.replace(/-/g, '_')}`;
    const quotedSchema = quoteIdent(schemaName);

    console.log(`[SchemaInit] Creating schema: ${schemaName}`);

    try {
        // 1. Create the Schema
        await sql(`CREATE SCHEMA IF NOT EXISTS ${quotedSchema}`);

        // 2. Helper to get quoted full name
        const qName = (table: string) => `${quotedSchema}.${quoteIdent(table)}`;

        // 3. Create Tables in the new schema
        // We use sequential execution for DDL to ensure stability

        // Inventory
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('inventory')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                sku text UNIQUE NOT NULL,
                name text NOT NULL,
                buy_price decimal(12, 2) NOT NULL,
                sell_price decimal(12, 2),
                gst_percentage decimal(5, 2) NOT NULL DEFAULT 18.00,
                stock integer NOT NULL DEFAULT 0,
                hsn_code text,
                min_stock_level integer DEFAULT 0,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            )
        `);

        // Customers
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('customers')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                name text NOT NULL,
                phone text UNIQUE NOT NULL,
                address text,
                email text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            )
        `);

        // Suppliers
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('suppliers')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                name text NOT NULL,
                phone text,
                address text,
                gstin text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            )
        `);

        // Sales
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('sales')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                inventory_id uuid NOT NULL REFERENCES ${qName('inventory')}(id),
                user_id text,
                quantity integer NOT NULL,
                sale_price decimal(12, 2) NOT NULL,
                total_amount decimal(12, 2) NOT NULL,
                gst_amount decimal(12, 2) NOT NULL,
                profit decimal(12, 2) NOT NULL,
                payment_method text DEFAULT 'cash',
                payment_status text DEFAULT 'paid',
                customer_id uuid REFERENCES ${qName('customers')}(id),
                sale_date date NOT NULL DEFAULT current_date,
                created_at timestamp with time zone DEFAULT now()
            )
        `);

        // Expenses
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('expenses')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                category text NOT NULL,
                amount decimal(12, 2) NOT NULL,
                description text,
                expense_date date DEFAULT current_date,
                created_by text,
                created_at timestamp with time zone DEFAULT now()
            )
        `);

        // Khata Transactions
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('khata_transactions')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id uuid NOT NULL REFERENCES ${qName('customers')}(id) ON DELETE CASCADE,
                type text NOT NULL CHECK (type IN ('credit', 'payment')),
                amount decimal(12, 2) NOT NULL,
                sale_id uuid REFERENCES ${qName('sales')}(id),
                note text,
                created_by text,
                created_at timestamp with time zone DEFAULT now()
            )
        `);

        // Supplier Transactions
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('supplier_transactions')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                supplier_id uuid NOT NULL REFERENCES ${qName('suppliers')}(id) ON DELETE CASCADE,
                type text NOT NULL,
                amount decimal(12, 2) NOT NULL,
                note text,
                created_by text,
                created_at timestamp with time zone DEFAULT now()
            )
        `);

        // Daily Reports
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('daily_reports')} (
                report_date date PRIMARY KEY,
                total_sale_gross decimal(12, 2) NOT NULL DEFAULT 0,
                total_cost decimal(12, 2) NOT NULL DEFAULT 0,
                expenses decimal(12, 2) NOT NULL DEFAULT 0,
                cash_sale decimal(12, 2) NOT NULL DEFAULT 0,
                online_sale decimal(12, 2) NOT NULL DEFAULT 0,
                online_cost decimal(12, 2) NOT NULL DEFAULT 0,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            )
        `);

        // Audit Logs
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('audit_logs')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id text,
                action text NOT NULL,
                entity_type text NOT NULL,
                entity_id text,
                details jsonb,
                created_at timestamp with time zone DEFAULT now()
            )
        `);

        // Stock Movements (inventory ledger foundation)
        await sql(`
            CREATE TABLE IF NOT EXISTS ${qName('stock_movements')} (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                inventory_id uuid NOT NULL REFERENCES ${qName('inventory')}(id),
                quantity_delta integer NOT NULL,
                movement_type text NOT NULL,
                reference_type text,
                reference_id text,
                note text,
                created_by text,
                created_at timestamp with time zone DEFAULT now()
            )
        `);

        // Indexes
        await sql(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`idx_${schemaName}_sales_date`)} ON ${qName('sales')}(sale_date)`);
        await sql(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`idx_${schemaName}_audit_logs_created`)} ON ${qName('audit_logs')}(created_at DESC)`);
        await sql(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`idx_${schemaName}_khata_customer`)} ON ${qName('khata_transactions')}(customer_id)`);
        await sql(`CREATE INDEX IF NOT EXISTS ${quoteIdent(`idx_${schemaName}_stock_movements_inventory_created`)} ON ${qName('stock_movements')}(inventory_id, created_at DESC)`);

        console.log(`[SchemaInit] Successfully initialized schema: ${schemaName}`);

    } catch (error) {
        console.error(`[SchemaInit] Failed to initialize schema for ${orgId}:`, error);
        throw error;
    }
}
