-- enforce_immutability.sql
-- Goal: Ensure high-integrity ledger. Operations like record deletions are Forbidden.

-- 1. Create the enforcement function
CREATE OR REPLACE FUNCTION block_sales_modifications()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'CRITICAL SECURITY ERROR: Attempted DELETE on Immutable Ledger [sales table]. User ID: %, Action Blocked.', current_setting('app.current_user_id', true);
    ELSIF (TG_OP = 'UPDATE') THEN
        RAISE EXCEPTION 'CRITICAL SECURITY ERROR: Attempted UPDATE on Immutable Ledger [sales table]. History cannot be rewritten. Use contra-entries (Returns) for corrections.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind to sales table
DROP TRIGGER IF EXISTS trg_enforce_sales_immutability ON sales;
CREATE TRIGGER trg_enforce_sales_immutability
BEFORE UPDATE OR DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION block_sales_modifications();

-- 3. Bind to audit_logs (Optional but recommended for tampering detection)
DROP TRIGGER IF EXISTS trg_enforce_audit_immutability ON audit_logs;
CREATE TRIGGER trg_enforce_audit_immutability
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION block_sales_modifications();
