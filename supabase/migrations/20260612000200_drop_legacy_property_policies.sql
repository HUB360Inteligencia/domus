-- Remove the legacy RLS policies that the role-aware policies were meant to
-- replace. They were never dropped, so they coexisted with the new ones and,
-- because permissive policies are combined with OR, completely bypassed the
-- role check: the legacy "... from their client" policy is FOR ALL and only
-- tests org membership (any role, including viewer), so viewers could still
-- INSERT/UPDATE/DELETE.
--
-- After this migration the only policies left on these tables are the
-- role-aware *_own_or_writer / *_select_own_or_client set created in
-- 20260612000100_properties_org_sharing.sql.

-- properties ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only view properties from their client" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own properties"             ON public.properties;
DROP POLICY IF EXISTS "Users can create their own properties"           ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties"           ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties"           ON public.properties;

-- contracts -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only view contracts from their client" ON public.contracts;
DROP POLICY IF EXISTS "Users can view their contracts"                  ON public.contracts;
DROP POLICY IF EXISTS "Users can create their contracts"                ON public.contracts;
DROP POLICY IF EXISTS "Users can update their contracts"                ON public.contracts;
DROP POLICY IF EXISTS "Users can delete their contracts"                ON public.contracts;

-- documents -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only view documents from their client" ON public.documents;
DROP POLICY IF EXISTS "Users can view their documents"                  ON public.documents;
DROP POLICY IF EXISTS "Users can create their documents"                ON public.documents;
DROP POLICY IF EXISTS "Users can update their documents"                ON public.documents;
DROP POLICY IF EXISTS "Users can delete their documents"                ON public.documents;
