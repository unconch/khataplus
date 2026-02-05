-- Migration: Add GST specific columns to sales table
-- Reason: Required for GSTR-1 (B2B Sales) and HSN Summary reporting

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(20),
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10);

-- Recommended: Index on customer_gstin for B2B queries
CREATE INDEX IF NOT EXISTS idx_sales_customer_gstin ON sales(customer_gstin);
