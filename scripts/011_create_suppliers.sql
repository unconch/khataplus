-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    gstin TEXT,
    org_id TEXT NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Transactions (Purchase Ledger)
CREATE TABLE IF NOT EXISTS supplier_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'purchase' (credit) or 'payment' (debit)
    amount DECIMAL(12, 2) NOT NULL,
    note TEXT,
    created_by TEXT,
    org_id TEXT NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON suppliers(org_id);
CREATE INDEX IF NOT EXISTS idx_supplier_tx_supplier_id ON supplier_transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_tx_org_id ON supplier_transactions(org_id);
