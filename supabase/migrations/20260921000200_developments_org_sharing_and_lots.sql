-- =============================================================================
-- Loteamentos: compartilhamento por organização + lotes agrupados
--
-- Dois problemas:
--   1. `developments` e suas tabelas filhas só têm políticas por autor
--      ("Users can view their own developments"). Sem `client_id`, um colega da
--      organização não vê o empreendimento — ao contrário de `properties`.
--   2. Não existe vínculo entre `properties` e `developments`, então não há como
--      agrupar os lotes de um loteamento.
--
-- Decisão de modelagem: o lote é uma linha de `properties` (tipo `land`) apontando
-- para o loteamento por `development_id`. Assim o lote herda foto, documento,
-- contrato, avaliação, mapa e financeiro que já existem para imóveis, em vez de
-- reimplementar tudo sobre `development_units` (que segue como camada de
-- planejamento para prédios/unidades).
--
-- Idempotente e defensiva (o banco remoto é atualizado manualmente e pode estar
-- atrás destes arquivos).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. client_id no empreendimento
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.developments') IS NULL THEN
    RAISE NOTICE 'public.developments não existe; nada a fazer.';
    RETURN;
  END IF;

  ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS client_id uuid;

  IF to_regclass('public.clients') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.developments'::regclass
      AND conname = 'developments_client_id_fkey'
  ) THEN
    ALTER TABLE public.developments
      ADD CONSTRAINT developments_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Empreendimentos antigos passam a pertencer à organização do próprio autor,
-- senão continuariam invisíveis para o resto da equipe.
UPDATE public.developments d
SET client_id = cu.client_id
FROM public.client_users cu
WHERE d.client_id IS NULL
  AND cu.user_id = d.user_id;

CREATE INDEX IF NOT EXISTS developments_client_idx ON public.developments (client_id);

-- -----------------------------------------------------------------------------
-- 2. RLS do empreendimento por organização
--    As políticas antigas por user_id continuam valendo (somam por OR).
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS developments_select_org ON public.developments;
CREATE POLICY developments_select_org ON public.developments
  FOR SELECT TO authenticated
  USING (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS developments_insert_org ON public.developments;
CREATE POLICY developments_insert_org ON public.developments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.user_can_write_row(user_id, client_id));

DROP POLICY IF EXISTS developments_update_org ON public.developments;
CREATE POLICY developments_update_org ON public.developments
  FOR UPDATE TO authenticated
  USING (public.user_can_write_row(user_id, client_id))
  WITH CHECK (public.user_can_write_row(user_id, client_id));

DROP POLICY IF EXISTS developments_delete_org ON public.developments;
CREATE POLICY developments_delete_org ON public.developments
  FOR DELETE TO authenticated
  USING (public.user_can_write_row(user_id, client_id));

-- -----------------------------------------------------------------------------
-- 3. Tabelas filhas: quem vê/escreve o empreendimento vê/escreve os filhos
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  child text;
BEGIN
  FOREACH child IN ARRAY ARRAY[
    'development_units',
    'development_phases',
    'development_costs',
    'development_revenues',
    'development_documents',
    'development_milestones',
    'development_checklist_items'
  ]
  LOOP
    IF to_regclass('public.' || child) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', child || '_select_via_development', child);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
         EXISTS (SELECT 1 FROM public.developments d
                 WHERE d.id = %I.development_id
                   AND public.user_can_access_row(d.user_id, d.client_id)))',
      child || '_select_via_development', child, child);

    -- Estas tabelas não têm user_id próprio, então a escrita é governada só pelo pai.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', child || '_write_via_development', child);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING (EXISTS (SELECT 1 FROM public.developments d
                        WHERE d.id = %I.development_id
                          AND public.user_can_write_row(d.user_id, d.client_id)))
         WITH CHECK (EXISTS (SELECT 1 FROM public.developments d
                        WHERE d.id = %I.development_id
                          AND public.user_can_write_row(d.user_id, d.client_id)))',
      child || '_write_via_development', child, child, child);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Vínculo do lote com o loteamento
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.properties') IS NULL THEN
    RAISE NOTICE 'public.properties não existe; nada a fazer.';
    RETURN;
  END IF;

  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS development_id uuid;
  -- Quadra do lote: o número do lote continua em property_number.
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS block text;

  IF to_regclass('public.developments') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.properties'::regclass
      AND conname = 'properties_development_id_fkey'
  ) THEN
    -- SET NULL: excluir o loteamento não pode apagar os imóveis dos lotes.
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_development_id_fkey
      FOREIGN KEY (development_id) REFERENCES public.developments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS properties_development_idx
  ON public.properties (development_id)
  WHERE development_id IS NOT NULL;

COMMENT ON COLUMN public.properties.development_id IS
  'Loteamento/empreendimento que agrupa este imóvel. Lotes de um loteamento são properties tipo land com este campo preenchido.';
COMMENT ON COLUMN public.properties.block IS 'Quadra do lote. O número do lote fica em property_number.';

-- -----------------------------------------------------------------------------
-- 5. Totais do loteamento
--    Evita trazer todos os lotes ao cliente só para somar, e é usada na lista de
--    empreendimentos. SECURITY INVOKER: respeita a RLS de properties.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.development_lot_totals(p_development_id uuid)
RETURNS TABLE (
  total_lots bigint,
  sold_lots bigint,
  reserved_lots bigint,
  available_lots bigint,
  total_land_area numeric,
  total_market_value numeric,
  sold_value numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    count(*),
    count(*) FILTER (WHERE p.status = 'sold'),
    count(*) FILTER (WHERE p.status = 'reserved'),
    count(*) FILTER (WHERE p.status = 'available'),
    COALESCE(sum(p.land_area), 0),
    COALESCE(sum(p.value), 0),
    COALESCE(sum(p.value) FILTER (WHERE p.status = 'sold'), 0)
  FROM public.properties p
  WHERE p.development_id = p_development_id;
$$;

GRANT EXECUTE ON FUNCTION public.development_lot_totals(uuid) TO authenticated;
