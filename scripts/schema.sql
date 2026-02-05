-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('main admin', 'owner', 'staff')) DEFAULT 'staff',
    status TEXT CHECK (status IN ('pending', 'approved', 'disabled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table (System-wide configurations)
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    allow_staff_inventory BOOLEAN NOT NULL DEFAULT TRUE,
    allow_staff_sales BOOLEAN NOT NULL DEFAULT TRUE,
    allow_staff_bills BOOLEAN NOT NULL DEFAULT TRUE,
    allow_staff_analytics BOOLEAN NOT NULL DEFAULT FALSE,
    allow_staff_add_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    gst_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    gst_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial default settings
INSERT INTO settings (id, allow_staff_inventory, allow_staff_sales, allow_staff_bills, allow_staff_analytics, allow_staff_add_inventory, gst_enabled, gst_inclusive)
VALUES ('default', TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    buy_price DECIMAL(12, 2) NOT NULL,
    gst_percentage DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    inventory_id TEXT REFERENCES inventory(id),
    user_id TEXT REFERENCES profiles(id),
    quantity INTEGER NOT NULL,
    sale_price DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    gst_amount DECIMAL(12, 2) NOT NULL,
    profit DECIMAL(12, 2) NOT NULL,
    sale_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Reports Table (Financial records)
CREATE TABLE IF NOT EXISTS daily_reports (
    report_date DATE PRIMARY KEY,
    total_sale_gross DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
    expenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cash_sale DECIMAL(12, 2) NOT NULL DEFAULT 0,
    online_sale DECIMAL(12, 2) NOT NULL DEFAULT 0,
    online_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Existing indexes

-- Indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_sales_inventory_id ON sales(inventory_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_by TEXT REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

