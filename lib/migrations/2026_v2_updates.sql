-- Migration: V2 Communication & Payments Update
-- Add fields for Smart Share and Integrated Payments

-- 1. Sales Table Enhancements
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS payment_link TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- 2. Index for grouping by customer phone (useful for loyalty/history later)
CREATE INDEX IF NOT EXISTS idx_sales_customer_phone ON sales(customer_phone);

-- 3. Customer Table Enhancements for Reminders
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_overdue_reminders INTEGER DEFAULT 0;
