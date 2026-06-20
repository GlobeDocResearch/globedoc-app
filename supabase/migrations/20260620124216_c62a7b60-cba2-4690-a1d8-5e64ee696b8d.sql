CREATE OR REPLACE FUNCTION public._admin_list_auth_users()
RETURNS TABLE(id uuid, email text, email_confirmed_at timestamptz, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, email::text, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC;
$$;
REVOKE ALL ON FUNCTION public._admin_list_auth_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._admin_list_auth_users() TO service_role;