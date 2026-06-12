-- Make the write restriction honor the *effective* role: a user is read-only
-- if they are a 'viewer' in EITHER role system -- the organization role
-- (client_users.role) OR the system role (user_roles, via get_user_role()).
-- This is needed because the "Gerenciamento de Usuários" screen edits the
-- system role, while properties/contracts/documents are scoped by the org
-- role. Without this, marking someone as "Visualizador" on that screen would
-- not actually make them read-only.

-- System-role gate: true unless the current user's system role is 'viewer'.
CREATE OR REPLACE FUNCTION public.current_user_can_write()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(auth.uid()) IS DISTINCT FROM 'viewer'::public.app_role;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_can_write() TO authenticated;

-- Org-role gate already excludes viewer (IN admin/manager/user). The row-level
-- write check now also applies the system-role gate, so a viewer in either
-- system is blocked -- including from editing rows they own.
CREATE OR REPLACE FUNCTION public.user_can_write_row(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_can_write()
    AND (
      p_user_id = auth.uid()
      OR (p_client_id IS NOT NULL AND public.user_can_write_client(p_client_id))
    );
$$;

-- INSERT policies must also apply the system-role gate (the owner branch with
-- client_id IS NULL would otherwise let a system-viewer create rows).
DROP POLICY IF EXISTS properties_insert_own_or_writer ON public.properties;
CREATE POLICY properties_insert_own_or_writer ON public.properties
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.current_user_can_write()
    AND (client_id IS NULL OR public.user_can_write_client(client_id))
  );

DROP POLICY IF EXISTS contracts_insert_own_or_writer ON public.contracts;
CREATE POLICY contracts_insert_own_or_writer ON public.contracts
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.current_user_can_write()
    AND (client_id IS NULL OR public.user_can_write_client(client_id))
  );

DROP POLICY IF EXISTS documents_insert_own_or_writer ON public.documents;
CREATE POLICY documents_insert_own_or_writer ON public.documents
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.current_user_can_write()
    AND (client_id IS NULL OR public.user_can_write_client(client_id))
  );
