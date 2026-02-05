-- Phase 3 Organization Enhancements
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Phase 3 Daily Reports Multi-tenancy
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_report_date_key;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_reports_date_org_unique') THEN
        ALTER TABLE daily_reports ADD CONSTRAINT daily_reports_date_org_unique UNIQUE (report_date, org_id);
    END IF;
END $$;
