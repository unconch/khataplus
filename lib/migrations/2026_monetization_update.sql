-- Migration: 2026 Monetization Update
-- Transition from credit-based ledgers to flat add-on booleans
-- Introduce 30-day trial and Pioneer Partner status tracking

-- 1. Add Add-on Flags
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS whatsapp_addon_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gst_addon_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS inventory_pro_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vernacular_pack_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_forecast_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT FALSE;

-- 2. Trial and Pioneer Tracking
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS pioneer_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pioneer_joined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pioneer_certificate_id TEXT;

-- 3. Defaults for existing organizations (optional, but good for safety)
-- We'll assume existing paying users might need manual mapping or we just start fresh
-- For now, we keep existing 'free' users on the 30-day trial clock from today
UPDATE organizations 
SET trial_ends_at = (CURRENT_TIMESTAMP + INTERVAL '30 days')
WHERE plan_type = 'free' AND trial_ends_at IS NULL;

-- 4. Clean up old credit columns (Optional: Keep for backward compatibility or drop later)
-- comment out for safety; drop after app logic is updated.
-- ALTER TABLE organizations DROP COLUMN credits_whatsapp;
