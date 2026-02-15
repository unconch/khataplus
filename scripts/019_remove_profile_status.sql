-- Remove status column from profiles table as it is no longer needed
ALTER TABLE profiles DROP COLUMN IF EXISTS status;
