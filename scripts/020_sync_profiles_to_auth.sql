-- Function to sync profile data to auth.users metadata

CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'name', NEW.name,
      'phone', NEW.phone,
      'role', NEW.role
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STATEMENT_END

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_profile_update_sync_auth ON public.profiles;

-- STATEMENT_END

-- Create trigger
CREATE TRIGGER on_profile_update_sync_auth
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_auth_metadata();
