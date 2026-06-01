-- Security and finance hardening for the client-side Supabase architecture.
-- This migration is intentionally additive/idempotent: helpers, policies,
-- indexes and one transactional contract delete RPC.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid()
  ORDER BY CASE r.name
    WHEN 'system_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'user' THEN 4
    WHEN 'viewer' THEN 5
    ELSE 6
  END
  LIMIT 1;
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

CREATE OR REPLACE FUNCTION public.user_can_access_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_current_user_system_admin()
    OR EXISTS (
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
  SELECT
    public.is_current_user_system_admin()
    OR EXISTS (
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
    public.is_current_user_system_admin()
    OR p_user_id = auth.uid()
    OR (p_client_id IS NOT NULL AND public.user_can_access_client(p_client_id));
$$;

CREATE OR REPLACE FUNCTION public.delete_contract_cascade(p_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.contracts%ROWTYPE;
BEGIN
  SELECT *
  INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.user_can_access_row(v_contract.user_id, v_contract.client_id) THEN
    RAISE EXCEPTION 'Not authorized to delete this contract' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.activities WHERE contract_id = p_contract_id;
  DELETE FROM public.contract_value_adjustments WHERE contract_id = p_contract_id;
  DELETE FROM public.documents WHERE contract_id = p_contract_id;
  DELETE FROM public.contracts WHERE id = p_contract_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_contract_cascade(uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_client_users_user_id ON public.client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_client_id ON public.properties(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON public.contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_contract_id ON public.documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON public.financial_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_property_type ON public.financial_transactions(property_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_categories_user_type ON public.financial_categories(user_id, type);

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_self_or_system') THEN
    CREATE POLICY profiles_select_self_or_system ON public.profiles
      FOR SELECT TO authenticated
      USING (id = auth.uid() OR public.is_current_user_system_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_self_or_system') THEN
    CREATE POLICY profiles_update_self_or_system ON public.profiles
      FOR UPDATE TO authenticated
      USING (id = auth.uid() OR public.is_current_user_system_admin())
      WITH CHECK (id = auth.uid() OR public.is_current_user_system_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'clients_select_member_or_system') THEN
    CREATE POLICY clients_select_member_or_system ON public.clients
      FOR SELECT TO authenticated
      USING (public.is_current_user_system_admin() OR public.user_can_access_client(id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'clients_write_system_only') THEN
    CREATE POLICY clients_write_system_only ON public.clients
      FOR ALL TO authenticated
      USING (public.is_current_user_system_admin())
      WITH CHECK (public.is_current_user_system_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_users' AND policyname = 'client_users_select_self_admin_or_system') THEN
    CREATE POLICY client_users_select_self_admin_or_system ON public.client_users
      FOR SELECT TO authenticated
      USING (
        user_id = auth.uid()
        OR public.is_current_user_system_admin()
        OR (client_id IS NOT NULL AND public.user_can_admin_client(client_id))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_users' AND policyname = 'client_users_write_admin_or_system') THEN
    CREATE POLICY client_users_write_admin_or_system ON public.client_users
      FOR ALL TO authenticated
      USING (public.is_current_user_system_admin() OR (client_id IS NOT NULL AND public.user_can_admin_client(client_id)))
      WITH CHECK (public.is_current_user_system_admin() OR (client_id IS NOT NULL AND public.user_can_admin_client(client_id)));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'properties_access_own_or_client') THEN
    CREATE POLICY properties_access_own_or_client ON public.properties
      FOR ALL TO authenticated
      USING (public.user_can_access_row(user_id, client_id))
      WITH CHECK (public.user_can_access_row(user_id, client_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'contracts_access_own_or_client') THEN
    CREATE POLICY contracts_access_own_or_client ON public.contracts
      FOR ALL TO authenticated
      USING (public.user_can_access_row(user_id, client_id))
      WITH CHECK (public.user_can_access_row(user_id, client_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'documents_access_own_or_client') THEN
    CREATE POLICY documents_access_own_or_client ON public.documents
      FOR ALL TO authenticated
      USING (public.user_can_access_row(user_id, client_id))
      WITH CHECK (public.user_can_access_row(user_id, client_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'financial_transactions' AND policyname = 'financial_transactions_own_user') THEN
    CREATE POLICY financial_transactions_own_user ON public.financial_transactions
      FOR ALL TO authenticated
      USING (user_id = auth.uid() OR public.is_current_user_system_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_current_user_system_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'financial_categories' AND policyname = 'financial_categories_default_or_own') THEN
    CREATE POLICY financial_categories_default_or_own ON public.financial_categories
      FOR SELECT TO authenticated
      USING (user_id IS NULL OR user_id = auth.uid() OR public.is_current_user_system_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'financial_categories' AND policyname = 'financial_categories_write_own') THEN
    CREATE POLICY financial_categories_write_own ON public.financial_categories
      FOR ALL TO authenticated
      USING (user_id = auth.uid() OR public.is_current_user_system_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_current_user_system_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'roles_select_authenticated') THEN
    CREATE POLICY roles_select_authenticated ON public.roles
      FOR SELECT TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'permissions' AND policyname = 'permissions_select_authenticated') THEN
    CREATE POLICY permissions_select_authenticated ON public.permissions
      FOR SELECT TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_select_authenticated') THEN
    CREATE POLICY role_permissions_select_authenticated ON public.role_permissions
      FOR SELECT TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'user_roles_select_self_or_system') THEN
    CREATE POLICY user_roles_select_self_or_system ON public.user_roles
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.is_current_user_system_admin());
  END IF;
END $$;
