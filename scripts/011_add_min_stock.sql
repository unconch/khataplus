-- Migration 011: Add min_stock to inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;

-- Update existing items to have a reasonable default
UPDATE inventory SET min_stock = 5 WHERE min_stock IS NULL;
