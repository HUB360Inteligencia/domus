-- Split platform administration from tenant data access.
--
-- A system_admin can manage Domus organizations, users, and access levels,
-- but must not automatically see organization-sensitive operational data
-- such as properties, contracts, documents, and financial records.

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT r.name::public.app_role
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY CASE r.name
        WHEN 'system_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'user' THEN 4
        WHEN 'viewer' THEN 5
        ELSE 6
      END
      LIMIT 1
    ),
    'user'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'system_admin'::public.app_role, false);
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN public.get_user_role($1) = 'system_admin'::public.app_role THEN true
      ELSE EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = $1
          AND p.name = $2
      )
    END;
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_users cu
    WHERE cu.client_id = p_client_id
      AND cu.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_admin_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_users cu
    WHERE cu.client_id = p_client_id
      AND cu.user_id = auth.uid()
      AND cu.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_row(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id = auth.uid()
    OR (p_client_id IS NOT NULL AND public.user_can_access_client(p_client_id));
$$;

DROP POLICY IF EXISTS profiles_select_self_or_system ON public.profiles;
CREATE POLICY profiles_select_self_or_system ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_current_user_system_admin());

DROP POLICY IF EXISTS profiles_update_self_or_system ON public.profiles;
CREATE POLICY profiles_update_self_or_system ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_current_user_system_admin())
  WITH CHECK (id = auth.uid() OR public.is_current_user_system_admin());

DROP POLICY IF EXISTS profiles_insert_system_only ON public.profiles;
CREATE POLICY profiles_insert_system_only ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_system_admin());

DROP POLICY IF EXISTS profiles_delete_system_only ON public.profiles;
CREATE POLICY profiles_delete_system_only ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_current_user_system_admin());

DROP POLICY IF EXISTS clients_select_member_or_system ON public.clients;
CREATE POLICY clients_select_member_or_system ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_current_user_system_admin() OR public.user_can_access_client(id));

DROP POLICY IF EXISTS clients_write_system_only ON public.clients;
CREATE POLICY clients_write_system_only ON public.clients
  FOR ALL TO authenticated
  USING (public.is_current_user_system_admin())
  WITH CHECK (public.is_current_user_system_admin());

DROP POLICY IF EXISTS client_users_select_self_admin_or_system ON public.client_users;
CREATE POLICY client_users_select_self_admin_or_system ON public.client_users
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_current_user_system_admin()
    OR (client_id IS NOT NULL AND public.user_can_admin_client(client_id))
  );

DROP POLICY IF EXISTS client_users_write_admin_or_system ON public.client_users;
CREATE POLICY client_users_write_admin_or_system ON public.client_users
  FOR ALL TO authenticated
  USING (public.is_current_user_system_admin() OR (client_id IS NOT NULL AND public.user_can_admin_client(client_id)))
  WITH CHECK (public.is_current_user_system_admin() OR (client_id IS NOT NULL AND public.user_can_admin_client(client_id)));

DROP POLICY IF EXISTS user_roles_select_self_or_system ON public.user_roles;
CREATE POLICY user_roles_select_self_or_system ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_current_user_system_admin());

DROP POLICY IF EXISTS user_roles_insert_system_only ON public.user_roles;
CREATE POLICY user_roles_insert_system_only ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_system_admin());

DROP POLICY IF EXISTS user_roles_update_system_only ON public.user_roles;
CREATE POLICY user_roles_update_system_only ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_current_user_system_admin())
  WITH CHECK (public.is_current_user_system_admin());

DROP POLICY IF EXISTS user_roles_delete_system_only ON public.user_roles;
CREATE POLICY user_roles_delete_system_only ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_current_user_system_admin());

DROP POLICY IF EXISTS properties_access_own_or_client ON public.properties;
CREATE POLICY properties_access_own_or_client ON public.properties
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS contracts_access_own_or_client ON public.contracts;
CREATE POLICY contracts_access_own_or_client ON public.contracts
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS documents_access_own_or_client ON public.documents;
CREATE POLICY documents_access_own_or_client ON public.documents
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS financial_transactions_own_user ON public.financial_transactions;
CREATE POLICY financial_transactions_own_user ON public.financial_transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS financial_categories_default_or_own ON public.financial_categories;
CREATE POLICY financial_categories_default_or_own ON public.financial_categories
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS financial_categories_write_own ON public.financial_categories;
CREATE POLICY financial_categories_write_own ON public.financial_categories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
