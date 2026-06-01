-- Módulo Contatos — núcleo: cadastro central de pessoas (PF) e empresas (PJ)
-- com múltiplos papéis, multi-tenant (user_id + client_id), RLS e permissões.
--
-- Segue o padrão dual-scope do Domus (ver 20260531023000_agenda_operational_events.sql):
--   * user_id NOT NULL (dono) + client_id NULL (organização)
--   * enums via text + CHECK
--   * RLS FOR ALL via public.user_can_access_row(user_id, client_id)
--   * soft delete (deleted_at) filtrado na camada de aplicação

-- =====================================================================
-- 1. Tabelas
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'pf'
    CHECK (kind IN ('pf', 'pj')),
  display_name text NOT NULL,
  legal_name text,
  trade_name text,
  document_type text
    CHECK (document_type IS NULL OR document_type IN ('cpf', 'cnpj', 'other')),
  document_number text,
  rg text,
  state_registration text,
  municipal_registration text,
  birth_date date,
  foundation_date date,
  nationality text,
  marital_status text,
  profession text,
  primary_whatsapp text,
  primary_phone text,
  secondary_phone text,
  primary_email text,
  secondary_email text,
  website text,
  social_url text,
  zip_code text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  country text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'review', 'blocked')),
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.contact_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  role_type text NOT NULL
    CHECK (role_type IN (
      'tenant', 'guarantor', 'owner', 'partner', 'supplier', 'service_provider',
      'real_estate_agency', 'broker', 'accountant', 'lawyer', 'building_manager',
      'condominium_administrator', 'insurance_company', 'bank',
      'financial_responsible', 'other'
    )),
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- =====================================================================
-- 2. Índices
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_contacts_user_id
  ON public.contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_contacts_client_id
  ON public.contacts(client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_status
  ON public.contacts(user_id, status)
  WHERE deleted_at IS NULL;

-- Índices de deduplicação (NÃO únicos — apenas para o aviso "warn, don't block")
CREATE INDEX IF NOT EXISTS idx_contacts_document_number
  ON public.contacts(user_id, document_number)
  WHERE document_number IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_primary_email
  ON public.contacts(user_id, lower(primary_email))
  WHERE primary_email IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_primary_phone
  ON public.contacts(user_id, primary_phone)
  WHERE primary_phone IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contact_roles_contact
  ON public.contact_roles(contact_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contact_roles_role
  ON public.contact_roles(user_id, role_type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contact_roles_client_id
  ON public.contact_roles(client_id)
  WHERE client_id IS NOT NULL;

-- Um papel não pode se repetir para o mesmo contato (entre os ativos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_roles_unique
  ON public.contact_roles(contact_id, role_type)
  WHERE deleted_at IS NULL;

-- =====================================================================
-- 3. updated_at automático (reutiliza trigger genérico se existir)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_contact_roles_updated_at ON public.contact_roles;
CREATE TRIGGER trg_contact_roles_updated_at
  BEFORE UPDATE ON public.contact_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 4. Row Level Security
-- =====================================================================

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_access_own_or_client ON public.contacts;
CREATE POLICY contacts_access_own_or_client ON public.contacts
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS contact_roles_access_own_or_client ON public.contact_roles;
CREATE POLICY contact_roles_access_own_or_client ON public.contact_roles
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

-- =====================================================================
-- 5. Permissões (padrão pontuado, integradas a user_has_permission)
-- =====================================================================

INSERT INTO public.permissions (name, description)
VALUES
  ('contacts.view', 'Visualizar contatos'),
  ('contacts.create', 'Criar contatos'),
  ('contacts.edit', 'Editar contatos'),
  ('contacts.delete', 'Inativar/excluir contatos'),
  ('contacts.links.manage', 'Gerenciar vínculos de contatos (imóveis, contratos, documentos, transações)'),
  ('contacts.interactions.view', 'Visualizar histórico de interações de contatos'),
  ('contacts.interactions.manage', 'Registrar/editar interações de contatos'),
  ('contacts.financial.view', 'Visualizar dados financeiros na ficha do contato'),
  ('contacts.documents.view', 'Visualizar documentos vinculados ao contato')
ON CONFLICT (name) DO NOTHING;

-- Concessões por papel:
--   manager  -> todas as permissões de contatos
--   user     -> visualizar/criar/editar/vincular/interagir (sem delete, financeiro restrito)
--   viewer   -> somente leitura
-- (admin e system_admin já fazem bypass de permissões granulares.)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
  'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
  'contacts.links.manage', 'contacts.interactions.view', 'contacts.interactions.manage',
  'contacts.financial.view', 'contacts.documents.view'
)
WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
  'contacts.view', 'contacts.create', 'contacts.edit',
  'contacts.links.manage', 'contacts.interactions.view', 'contacts.interactions.manage',
  'contacts.documents.view'
)
WHERE r.name = 'user'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
  'contacts.view', 'contacts.interactions.view', 'contacts.documents.view'
)
WHERE r.name = 'viewer'
ON CONFLICT DO NOTHING;
