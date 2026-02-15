-- Backfill phone numbers from organizations to profiles for users who have a NULL phone in profile but have an org
-- valid for cases where the user created an org (and thus provided a phone) but the profile wasn't updated due to the bug

UPDATE profiles p
SET phone = o.phone
FROM organization_members om
JOIN organizations o ON om.org_id = o.id
WHERE p.id = om.user_id
  AND p.phone IS NULL
  AND o.phone IS NOT NULL;
