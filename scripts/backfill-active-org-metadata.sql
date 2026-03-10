-- Backfill Supabase auth user metadata for active org context.
-- Run in Supabase SQL editor or via psql with access to auth schema.

WITH ranked_memberships AS (
  SELECT
    m.user_id,
    m.role,
    o.slug,
    o.id AS org_id,
    ROW_NUMBER() OVER (
      PARTITION BY m.user_id
      ORDER BY m.created_at ASC NULLS LAST, m.org_id
    ) AS rn
  FROM organization_members m
  JOIN organizations o ON o.id = m.org_id
  WHERE o.slug IS NOT NULL
)
UPDATE auth.users u
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(u.raw_user_meta_data, '{}'::jsonb),
      '{active_org_slug}',
      to_jsonb(r.slug),
      true
    ),
    '{active_org_id}',
    to_jsonb(r.org_id),
    true
  ),
  '{active_org_role}',
  to_jsonb(r.role),
  true
)
FROM ranked_memberships r
WHERE r.rn = 1
  AND u.id = r.user_id
  AND (
    u.raw_user_meta_data->>'active_org_slug' IS NULL
    OR u.raw_user_meta_data->>'active_org_id' IS NULL
    OR u.raw_user_meta_data->>'active_org_role' IS NULL
  );
