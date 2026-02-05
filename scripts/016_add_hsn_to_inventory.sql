-- Migration: Add HSN Code to Inventory
-- Reason: To automate HSN capture in Sales for GSTR-1

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10);
