-- Add business details to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add settings JSONB for per-organization preferences
-- This will store: gst_enabled, gst_inclusive, staff_permissions, etc.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "gst_enabled": true,
    "gst_inclusive": false,
    "allow_staff_inventory": true,
    "allow_staff_sales": true,
    "allow_staff_reports": true,
    "allow_staff_reports_entry_only": false,
    "allow_staff_analytics": false,
    "allow_staff_add_inventory": false
}'::jsonb;

-- Create index on GSTIN for lookup
CREATE INDEX IF NOT EXISTS idx_organizations_gstin ON organizations(gstin);
