-- Share properties, contracts and documents with the whole organization
-- while respecting member roles.
--
-- Until now these rows were effectively writable only by their creator: the
-- app never filled client_id on insert, so the org branch of
-- user_can_access_row() never matched and colleagues could neither edit nor
-- delete (and deletes failed silently). This migration:
--   1. adds write-permission helpers that exclude read-only members (viewer);
--   2. auto-fills client_id on insert from the creator's organization;
--   3. backfills client_id on existing rows;
--   4. splits the FOR ALL policies so any org member can SELECT, but only
--      admin/manager/user members (or the creator) can INSERT/UPDATE/DELETE;
--   5. tightens delete_contract_cascade to require write access.

-- ---------------------------------------------------------------------------
-- 1. Permission helpers
-- ---------------------------------------------------------------------------

-- Org member whose role allows writing (viewer is read-only).
CREATE OR REPLACE FUNCTION public.user_can_write_client(p_client_id uuid)
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
      AND cu.role IN ('admin', 'manager', 'user')
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_can_write_client(uuid) TO authenticated;

-- Row-level write check: the creator, or an org member with a writing role.
CREATE OR REPLACE FUNCTION public.user_can_write_row(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id = auth.uid()
    OR (p_client_id IS NOT NULL AND public.user_can_write_client(p_client_id));
$$;

GRANT EXECUTE ON FUNCTION public.user_can_write_row(uuid, uuid) TO authenticated;

-- Current user's organization, when the membership is unambiguous.
CREATE OR REPLACE FUNCTION public.current_user_single_client_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN COUNT(DISTINCT client_id) = 1 THEN (array_agg(DISTINCT client_id))[1]
  END
  FROM public.client_users
  WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_single_client_id() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fill client_id automatically on insert
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_row_client_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    NEW.client_id := public.current_user_single_client_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_properties_set_client_id ON public.properties;
CREATE TRIGGER trg_properties_set_client_id
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_client_id();

DROP TRIGGER IF EXISTS trg_contracts_set_client_id ON public.contracts;
CREATE TRIGGER trg_contracts_set_client_id
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_client_id();

DROP TRIGGER IF EXISTS trg_documents_set_client_id ON public.documents;
CREATE TRIGGER trg_documents_set_client_id
  BEFORE INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_client_id();

-- ---------------------------------------------------------------------------
-- 3. Backfill: attach orphan rows to their creator's organization
-- (only when the creator belongs to exactly one org, to avoid cross-tenant
-- mistakes).
-- ---------------------------------------------------------------------------

WITH single_org AS (
  SELECT user_id, (array_agg(DISTINCT client_id))[1] AS client_id
  FROM public.client_users
  GROUP BY user_id
  HAVING COUNT(DISTINCT client_id) = 1
)
UPDATE public.properties p
SET client_id = m.client_id
FROM single_org m
WHERE p.client_id IS NULL
  AND p.user_id = m.user_id;

WITH single_org AS (
  SELECT user_id, (array_agg(DISTINCT client_id))[1] AS client_id
  FROM public.client_users
  GROUP BY user_id
  HAVING COUNT(DISTINCT client_id) = 1
)
UPDATE public.contracts c
SET client_id = m.client_id
FROM single_org m
WHERE c.client_id IS NULL
  AND c.user_id = m.user_id;

WITH single_org AS (
  SELECT user_id, (array_agg(DISTINCT client_id))[1] AS client_id
  FROM public.client_users
  GROUP BY user_id
  HAVING COUNT(DISTINCT client_id) = 1
)
UPDATE public.documents d
SET client_id = m.client_id
FROM single_org m
WHERE d.client_id IS NULL
  AND d.user_id = m.user_id;

-- ---------------------------------------------------------------------------
-- 4. Replace the single FOR ALL policies with read/write-specific policies
-- ---------------------------------------------------------------------------

-- properties ----------------------------------------------------------------
DROP POLICY IF EXISTS properties_access_own_or_client ON public.properties;
DROP POLICY IF EXISTS properties_select_own_or_client ON public.properties;
DROP POLICY IF EXISTS properties_insert_own_or_writer ON public.properties;
DROP POLICY IF EXISTS properties_update_own_or_writer ON public.properties;
DROP POLICY IF EXISTS properties_delete_own_or_writer ON public.properties;

-- Any member of the organization (including viewers) can read.
CREATE POLICY properties_select_own_or_client ON public.properties
  FOR SELECT
  USING (public.user_can_access_row(user_id, client_id));

-- Creating requires owning the row and, when it belongs to an org,
-- a role that allows writing (the BEFORE INSERT trigger fills client_id
-- before this check runs, so viewers cannot bypass it by omitting it).
CREATE POLICY properties_insert_own_or_writer ON public.properties
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (client_id IS NULL OR public.user_can_write_client(client_id))
  );

CREATE POLICY properties_update_own_or_writer ON public.properties
  FOR UPDATE
  USING (public.user_can_write_row(user_id, client_id))
  WITH CHECK (public.user_can_write_row(user_id, client_id));

CREATE POLICY properties_delete_own_or_writer ON public.properties
  FOR DELETE
  USING (public.user_can_write_row(user_id, client_id));

-- contracts -------------------------------------------------------------------
DROP POLICY IF EXISTS contracts_access_own_or_client ON public.contracts;
DROP POLICY IF EXISTS contracts_select_own_or_client ON public.contracts;
DROP POLICY IF EXISTS contracts_insert_own_or_writer ON public.contracts;
DROP POLICY IF EXISTS contracts_update_own_or_writer ON public.contracts;
DROP POLICY IF EXISTS contracts_delete_own_or_writer ON public.contracts;

CREATE POLICY contracts_select_own_or_client ON public.contracts
  FOR SELECT
  USING (public.user_can_access_row(user_id, client_id));

CREATE POLICY contracts_insert_own_or_writer ON public.contracts
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (client_id IS NULL OR public.user_can_write_client(client_id))
  );

CREATE POLICY contracts_update_own_or_writer ON public.contracts
  FOR UPDATE
  USING (public.user_can_write_row(user_id, client_id))
  WITH CHECK (public.user_can_write_row(user_id, client_id));

CREATE POLICY contracts_delete_own_or_writer ON public.contracts
  FOR DELETE
  USING (public.user_can_write_row(user_id, client_id));

-- documents -------------------------------------------------------------------
DROP POLICY IF EXISTS documents_access_own_or_client ON public.documents;
DROP POLICY IF EXISTS documents_select_own_or_client ON public.documents;
DROP POLICY IF EXISTS documents_insert_own_or_writer ON public.documents;
DROP POLICY IF EXISTS documents_update_own_or_writer ON public.documents;
DROP POLICY IF EXISTS documents_delete_own_or_writer ON public.documents;

CREATE POLICY documents_select_own_or_client ON public.documents
  FOR SELECT
  USING (public.user_can_access_row(user_id, client_id));

CREATE POLICY documents_insert_own_or_writer ON public.documents
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (client_id IS NULL OR public.user_can_write_client(client_id))
  );

CREATE POLICY documents_update_own_or_writer ON public.documents
  FOR UPDATE
  USING (public.user_can_write_row(user_id, client_id))
  WITH CHECK (public.user_can_write_row(user_id, client_id));

CREATE POLICY documents_delete_own_or_writer ON public.documents
  FOR DELETE
  USING (public.user_can_write_row(user_id, client_id));

-- ---------------------------------------------------------------------------
-- 5. delete_contract_cascade must require write access (not just read):
-- a viewer is an org member and would pass user_can_access_row.
-- ---------------------------------------------------------------------------

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

  IF NOT public.user_can_write_row(v_contract.user_id, v_contract.client_id) THEN
    RAISE EXCEPTION 'Not authorized to delete this contract' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.activities WHERE contract_id = p_contract_id;
  DELETE FROM public.contract_value_adjustments WHERE contract_id = p_contract_id;
  DELETE FROM public.documents WHERE contract_id = p_contract_id;
  DELETE FROM public.contracts WHERE id = p_contract_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_contract_cascade(uuid) TO authenticated;
