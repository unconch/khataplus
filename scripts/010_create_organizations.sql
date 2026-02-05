-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')) DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);

-- Organization Invites
CREATE TABLE IF NOT EXISTS organization_invites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);

-- Add org_id to existing tables for data isolation
ALTER TABLE customers ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id);
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id);
ALTER TABLE khata_transactions ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES organizations(id);

-- Indexes for org_id lookups
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(org_id);
