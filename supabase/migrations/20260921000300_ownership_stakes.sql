-- =============================================================================
-- Sociedade: participação percentual em imóvel ou loteamento
--
-- Hoje não existe onde registrar sócios: `PartnersList.tsx` guardava nome e
-- percentual em state local e nunca persistiu nada. Sem isso, um loteamento
-- 50/50 aparece no dashboard como se fosse 100% do usuário.
--
-- Modelagem:
--   - O sócio é um `contacts` (que já tem o papel 'partner'), não texto solto.
--   - A participação aponta para UM alvo: um imóvel ou um loteamento.
--   - `is_self` marca a fatia do próprio titular/organização, para o app poder
--     responder "quanto disso é meu".
--   - Lote sem participação própria herda a do loteamento — a herança é resolvida
--     na aplicação (`src/lib/ownership.ts`), para a regra existir em um só lugar.
--
-- Idempotente e defensiva (o banco remoto é atualizado manualmente).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ownership_stakes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  development_id uuid REFERENCES public.developments(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  -- Participação do próprio titular/organização.
  is_self boolean NOT NULL DEFAULT false,
  percentage numeric(7, 4) NOT NULL,
  role text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ownership_stakes_percentage_check
    CHECK (percentage > 0 AND percentage <= 100),
  -- Exatamente um alvo: imóvel OU loteamento.
  CONSTRAINT ownership_stakes_single_target_check
    CHECK ((property_id IS NOT NULL)::int + (development_id IS NOT NULL)::int = 1),
  -- Toda participação tem dono: ou é a própria, ou aponta para um contato.
  CONSTRAINT ownership_stakes_owner_check
    CHECK (is_self OR contact_id IS NOT NULL)
);

DO $$
BEGIN
  IF to_regclass('public.clients') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.ownership_stakes'::regclass
      AND conname = 'ownership_stakes_client_id_fkey'
  ) THEN
    ALTER TABLE public.ownership_stakes
      ADD CONSTRAINT ownership_stakes_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Uma única fatia própria por alvo, e um contato não se repete no mesmo alvo.
CREATE UNIQUE INDEX IF NOT EXISTS ownership_stakes_one_self_per_property
  ON public.ownership_stakes (property_id) WHERE is_self AND property_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ownership_stakes_one_self_per_development
  ON public.ownership_stakes (development_id) WHERE is_self AND development_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ownership_stakes_unique_contact_per_property
  ON public.ownership_stakes (property_id, contact_id) WHERE property_id IS NOT NULL AND contact_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ownership_stakes_unique_contact_per_development
  ON public.ownership_stakes (development_id, contact_id) WHERE development_id IS NOT NULL AND contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ownership_stakes_property_idx
  ON public.ownership_stakes (property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ownership_stakes_development_idx
  ON public.ownership_stakes (development_id) WHERE development_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ownership_stakes_contact_idx
  ON public.ownership_stakes (contact_id) WHERE contact_id IS NOT NULL;

ALTER TABLE public.ownership_stakes ENABLE ROW LEVEL SECURITY;

-- Visível/editável por quem vê/escreve o alvo (imóvel ou loteamento).
DROP POLICY IF EXISTS ownership_stakes_select_via_target ON public.ownership_stakes;
CREATE POLICY ownership_stakes_select_via_target
  ON public.ownership_stakes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ownership_stakes.property_id
        AND public.user_can_access_row(p.user_id, p.client_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.developments d
      WHERE d.id = ownership_stakes.development_id
        AND public.user_can_access_row(d.user_id, d.client_id)
    )
  );

DROP POLICY IF EXISTS ownership_stakes_insert_via_target ON public.ownership_stakes;
CREATE POLICY ownership_stakes_insert_via_target
  ON public.ownership_stakes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = ownership_stakes.property_id
          AND public.user_can_write_row(p.user_id, p.client_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.developments d
        WHERE d.id = ownership_stakes.development_id
          AND public.user_can_write_row(d.user_id, d.client_id)
      )
    )
  );

-- UPDATE/DELETE não exigem autoria: um colega que pode escrever no imóvel também
-- corrige a participação lançada por outro.
DROP POLICY IF EXISTS ownership_stakes_update_via_target ON public.ownership_stakes;
CREATE POLICY ownership_stakes_update_via_target
  ON public.ownership_stakes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ownership_stakes.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.developments d
      WHERE d.id = ownership_stakes.development_id
        AND public.user_can_write_row(d.user_id, d.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ownership_stakes.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.developments d
      WHERE d.id = ownership_stakes.development_id
        AND public.user_can_write_row(d.user_id, d.client_id)
    )
  );

DROP POLICY IF EXISTS ownership_stakes_delete_via_target ON public.ownership_stakes;
CREATE POLICY ownership_stakes_delete_via_target
  ON public.ownership_stakes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = ownership_stakes.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.developments d
      WHERE d.id = ownership_stakes.development_id
        AND public.user_can_write_row(d.user_id, d.client_id)
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ownership_stakes_updated_at ON public.ownership_stakes;
CREATE TRIGGER trg_ownership_stakes_updated_at
  BEFORE UPDATE ON public.ownership_stakes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.ownership_stakes IS
  'Participação societária em um imóvel ou loteamento. A herança lote<-loteamento e o cálculo da fatia própria ficam em src/lib/ownership.ts.';
COMMENT ON COLUMN public.ownership_stakes.is_self IS
  'true na fatia do próprio titular/organização. Quando ausente, a fatia própria é 100 menos a soma das participações de terceiros.';
