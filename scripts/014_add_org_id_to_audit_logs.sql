-- Add org_id to audit_logs for SaaS multi-tenancy tracking
-- Note: organizations.id is TEXT, so we use TEXT here for compatibility
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster tenant-based audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id);
