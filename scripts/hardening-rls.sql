-- Enable RLS on specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Isolation by org_id
-- We assume the application sets 'app.current_org_id' in the transaction session.

-- Inventory
CREATE POLICY tenant_isolation_inventory ON inventory
    USING (org_id = current_setting('app.current_org_id')::text);

-- Sales
CREATE POLICY tenant_isolation_sales ON sales
    USING (org_id = current_setting('app.current_org_id')::text);

-- Reports
CREATE POLICY tenant_isolation_reports ON daily_reports
    USING (org_id = current_setting('app.current_org_id')::text);

-- Profiles (Users can see themselves)
CREATE POLICY user_self_access ON profiles
    USING (id = current_setting('app.current_user_id')::text);

-- Note: The application usually connects as 'postgres' or similar superuser/admin role which BYPASSES RLS.
-- To enforce this, use a separate role (e.g. 'app_user') and ensure the connection string uses that.
-- And UPDATE lib/db.ts to run: set_config('app.current_org_id', orgId, true) before queries.
