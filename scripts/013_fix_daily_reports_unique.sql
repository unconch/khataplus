-- Fix Daily Reports Unique Constraint for Multi-tenancy
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_report_date_key;
ALTER TABLE daily_reports ADD CONSTRAINT daily_reports_date_org_unique UNIQUE (report_date, org_id);
