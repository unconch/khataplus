-- 1. Monetization & Subscription Schema
-- Upgrading the organization table to support tiered plans and usage quotas

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free', -- 'free', 'starter', 'pro'
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active', -- 'active', 'past_due', 'canceled'
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS credits_whatsapp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_staff INTEGER DEFAULT 1, -- Default 1 (Owner) + plan allowance
ADD COLUMN IF NOT EXISTS credits_inventory INTEGER DEFAULT 100;

-- 2. GST Automation Schema
-- enhancing sales table for accurate GSTR-1 and GSTR-3B reporting

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS hsn_code TEXT,
ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2), -- e.g., 18.00
ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cess_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS place_of_supply TEXT; -- State Code (e.g., '18-Assam')

-- 3. Billing History (Internal)
-- To track the subscription payments made by the merchant to KhataPlus

CREATE TABLE IF NOT EXISTS platform_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT REFERENCES organizations(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending', -- 'paid', 'failed'
    plan_type TEXT,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    razorpay_payment_id TEXT,
    invoice_url TEXT, -- PDF link
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster GSTR generation
CREATE INDEX IF NOT EXISTS idx_sales_gstr_reporting ON sales (org_id, created_at, hsn_code);
