-- 1. Returns & Refunds Table
CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    original_sale_id TEXT REFERENCES sales(id),
    inventory_id TEXT REFERENCES inventory(id),
    quantity INTEGER NOT NULL,
    refund_amount DECIMAL(12, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Biometric Security for Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_required BOOLEAN DEFAULT FALSE;

-- 3. Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Expense Categories
INSERT INTO expense_categories (name, is_default) VALUES 
('Rent', TRUE),
('Utilities', TRUE),
('Salary', TRUE),
('Maintenance', TRUE),
('Transport', TRUE),
('Tea/Snacks', TRUE),
('Packaging', TRUE),
('Marketing', TRUE)
ON CONFLICT (name) DO NOTHING;
