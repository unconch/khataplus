-- organizations_dek.sql
-- Add support for tenant-specific Data Encryption Keys (DEKs) wrapped by the Master Key (KEK)

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS encrypted_dek TEXT;

-- Goal: Each organization gets a unique AES-256 key, encrypted by the system ENCRYPTION_KEY.
-- This allows rotating the Master Key without re-encrypting all historical data in the system.
