-- Expose user account metadata (creation date and last sign-in) to the user
-- management screen. last_sign_in_at and the authoritative created_at live in
-- auth.users, which the frontend cannot read with the anon/authenticated key.
-- This SECURITY DEFINER RPC returns them together with the profile and role in
-- a single call (replacing the previous N+1 get_user_role-per-user pattern),
-- gated to callers who can manage users.

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role public.app_role,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(p.email, au.email)        AS email,
    p.first_name,
    p.last_name,
    public.get_user_role(p.id)         AS role,
    au.created_at,
    au.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE public.is_current_user_system_admin()
     OR public.user_has_permission(auth.uid(), 'manage_users')
  ORDER BY p.first_name NULLS LAST, p.last_name NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
