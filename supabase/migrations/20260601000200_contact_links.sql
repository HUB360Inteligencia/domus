-- Módulo Contatos — vínculos e interações.
-- Tabelas N:N entre contatos e imóveis/contratos, e o histórico de interações.
-- Mesmo padrão dual-scope (user_id + client_id) + RLS _access_own_or_client.

-- =====================================================================
-- 1. contact_property_links — contato <-> imóvel (N:N, qualificado por papel)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.contact_property_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  link_role text NOT NULL DEFAULT 'other'
    CHECK (link_role IN (
      'owner', 'partner', 'current_tenant', 'former_tenant', 'recurring_provider',
      'building_manager', 'condominium_administrator', 'responsible', 'other'
    )),
  participation_percentage numeric,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- =====================================================================
-- 2. contact_contract_links — contato <-> contrato (N:N, qualificado por papel)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.contact_contract_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  link_role text NOT NULL DEFAULT 'other'
    CHECK (link_role IN (
      'tenant', 'guarantor', 'owner', 'financial_responsible',
      'real_estate_agency', 'broker', 'witness', 'other'
    )),
  is_payment_responsible boolean NOT NULL DEFAULT false,
  is_receiving_responsible boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- =====================================================================
-- 3. contact_interactions — histórico de interações (timeline)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  interaction_type text NOT NULL DEFAULT 'note'
    CHECK (interaction_type IN (
      'call', 'whatsapp', 'email', 'meeting', 'visit', 'charge',
      'negotiation', 'maintenance', 'occurrence', 'note'
    )),
  interaction_date timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL,
  next_action text,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- =====================================================================
-- 4. Índices
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_cpl_contact
  ON public.contact_property_links(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cpl_property
  ON public.contact_property_links(property_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cpl_client
  ON public.contact_property_links(client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cpl_unique
  ON public.contact_property_links(contact_id, property_id, link_role)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ccl_contact
  ON public.contact_contract_links(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ccl_contract
  ON public.contact_contract_links(contract_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ccl_client
  ON public.contact_contract_links(client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ccl_unique
  ON public.contact_contract_links(contact_id, contract_id, link_role)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ci_contact_date
  ON public.contact_interactions(contact_id, interaction_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ci_client
  ON public.contact_interactions(client_id) WHERE client_id IS NOT NULL;

-- =====================================================================
-- 5. updated_at automático
-- =====================================================================

DROP TRIGGER IF EXISTS trg_cpl_updated_at ON public.contact_property_links;
CREATE TRIGGER trg_cpl_updated_at
  BEFORE UPDATE ON public.contact_property_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ccl_updated_at ON public.contact_contract_links;
CREATE TRIGGER trg_ccl_updated_at
  BEFORE UPDATE ON public.contact_contract_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ci_updated_at ON public.contact_interactions;
CREATE TRIGGER trg_ci_updated_at
  BEFORE UPDATE ON public.contact_interactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 6. Row Level Security (_access_own_or_client)
-- =====================================================================

ALTER TABLE public.contact_property_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_contract_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_property_links_access_own_or_client ON public.contact_property_links;
CREATE POLICY contact_property_links_access_own_or_client ON public.contact_property_links
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS contact_contract_links_access_own_or_client ON public.contact_contract_links;
CREATE POLICY contact_contract_links_access_own_or_client ON public.contact_contract_links
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS contact_interactions_access_own_or_client ON public.contact_interactions;
CREATE POLICY contact_interactions_access_own_or_client ON public.contact_interactions
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));
