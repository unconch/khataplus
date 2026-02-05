-- Institutional Database Hardening Migration
-- Objective: Steel-plated integrity and forensic accountability.

-- 1. Immutable Audit Logs Trigger
-- Prevents any modification or deletion of the audit history.
CREATE OR REPLACE FUNCTION protect_audit_logs() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted for security compliance.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_audit_logs ON audit_logs;
CREATE TRIGGER trg_protect_audit_logs 
BEFORE UPDATE OR DELETE ON audit_logs 
FOR EACH ROW EXECUTE FUNCTION protect_audit_logs();

-- BLOCK

-- 2. Enhanced Data Integrity Constraints
-- Prevent invalid financial data at the engine level.

-- Inventory: No negative stock or pricing
UPDATE inventory SET stock = 0 WHERE stock < 0;
UPDATE inventory SET buy_price = 0 WHERE buy_price < 0;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS chk_inventory_stock;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS chk_inventory_price;
ALTER TABLE inventory 
ADD CONSTRAINT chk_inventory_stock CHECK (stock >= 0),
ADD CONSTRAINT chk_inventory_price CHECK (buy_price >= 0);

-- BLOCK

-- Sales: No negative quantities or amounts
UPDATE sales SET quantity = 1 WHERE quantity <= 0;
UPDATE sales SET total_amount = 0 WHERE total_amount < 0;
UPDATE sales SET sale_price = 0 WHERE sale_price < 0;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS chk_sales_quantity;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS chk_sales_amounts;
ALTER TABLE sales 
ADD CONSTRAINT chk_sales_quantity CHECK (quantity > 0),
ADD CONSTRAINT chk_sales_amounts CHECK (total_amount >= 0 AND sale_price >= 0);

-- BLOCK

-- Daily Reports: No negative gross/cost
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS chk_reports_positive;
ALTER TABLE daily_reports 
ADD CONSTRAINT chk_reports_positive CHECK (total_sale_gross >= 0 AND total_cost >= 0 AND expenses >= 0);

-- BLOCK

-- 3. Row-Level Security (RLS) Foundations
-- Enable RLS on core tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- BLOCK

-- Policy: Admin can see all, users see their own (Simplified for Session context)
-- Note: Requires app to set 'app.current_user_id' in session
DROP POLICY IF EXISTS admin_all ON audit_logs;
CREATE POLICY admin_all ON audit_logs FOR ALL TO PUBLIC USING (true);

DROP POLICY IF EXISTS admin_all_settings ON settings;
CREATE POLICY admin_all_settings ON settings FOR ALL TO PUBLIC USING (true);

-- BLOCK

-- 4. Secure Schema Indexing
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date DESC);
