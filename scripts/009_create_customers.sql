-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Khata Transactions Table (Credit Ledger)
CREATE TABLE IF NOT EXISTS khata_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
    amount DECIMAL(12, 2) NOT NULL,
    sale_id TEXT REFERENCES sales(id),
    note TEXT,
    created_by TEXT REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_khata_customer_id ON khata_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_khata_created_at ON khata_transactions(created_at DESC);
