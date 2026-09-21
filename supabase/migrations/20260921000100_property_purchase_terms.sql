-- =============================================================================
-- Forma de compra do imóvel + parcelas da aquisição
--
-- Hoje `properties` guarda apenas `purchase_value` e `purchase_date`: não há como
-- registrar SE a compra foi à vista, parcelada, financiada, permuta ou consórcio,
-- nem quando cada parcela vence. Resultado: uma compra parcelada em 60x não aparece
-- em nenhuma previsão de caixa.
--
-- Solução, espelhando o que já funciona para aluguel em `contract_expected_payments`:
--   1. Colunas de condição de pagamento em `properties`.
--   2. `property_purchase_installments`: uma linha por parcela, com vencimento,
--      status e `financial_transaction_id` (a baixa gera despesa real).
--   3. `generate_property_purchase_installments`: monta o cronograma a partir das
--      condições, preservando parcelas já pagas.
--   4. `record_property_purchase_installment`: dá baixa criando a transação de
--      despesa, no mesmo molde de `record_expected_contract_payment`.
--
-- Idempotente e defensiva (ver memória: o banco remoto é atualizado manualmente
-- e pode estar atrás destes arquivos).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Condição de pagamento no imóvel
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.properties') IS NULL THEN
    RAISE NOTICE 'public.properties não existe; nada a fazer.';
    RETURN;
  END IF;

  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS payment_type text;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS down_payment numeric(15, 2);
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS installments_count integer;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS installment_amount numeric(15, 2);
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS installment_frequency text;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS first_installment_date date;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS creditor_name text;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS purchase_index text;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS purchase_notes text;

  -- CHECKs adicionados só se ainda não existirem (migration re-executável).
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.properties'::regclass AND conname = 'properties_payment_type_check'
  ) THEN
    ALTER TABLE public.properties ADD CONSTRAINT properties_payment_type_check
      CHECK (payment_type IS NULL OR payment_type IN (
        'cash', 'installments', 'financed', 'barter', 'consortium', 'mixed'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.properties'::regclass AND conname = 'properties_installment_frequency_check'
  ) THEN
    ALTER TABLE public.properties ADD CONSTRAINT properties_installment_frequency_check
      CHECK (installment_frequency IS NULL OR installment_frequency IN (
        'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'
      ));
  END IF;
END $$;

COMMENT ON COLUMN public.properties.payment_type IS
  'Forma de compra: cash (à vista), installments (parcelado direto), financed (financiado), barter (permuta), consortium (consórcio), mixed.';
COMMENT ON COLUMN public.properties.down_payment IS 'Entrada/sinal. Gera a parcela número 0 no cronograma.';
COMMENT ON COLUMN public.properties.installment_amount IS
  'Valor de cada parcela. Se nulo, é derivado de (purchase_value - down_payment) / installments_count.';
COMMENT ON COLUMN public.properties.creditor_name IS 'A quem se paga: banco, vendedor, incorporadora, administradora do consórcio.';
COMMENT ON COLUMN public.properties.purchase_index IS 'Índice de correção das parcelas: igpm, incc, ipca, cdi, tr, none.';

-- -----------------------------------------------------------------------------
-- 2. Parcelas da aquisição
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_purchase_installments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid,
  financial_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  -- 0 = entrada/sinal; 1..n = parcelas.
  installment_number integer NOT NULL,
  amount numeric(15, 2) NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_purchase_installments_status_check
    CHECK (status IN ('pending', 'paid', 'cancelled')),
  CONSTRAINT property_purchase_installments_number_check
    CHECK (installment_number >= 0),
  CONSTRAINT property_purchase_installments_unique_number
    UNIQUE (property_id, installment_number)
);

-- FK de client_id só quando a tabela alvo existir (bancos antigos podem não ter).
DO $$
BEGIN
  IF to_regclass('public.clients') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.property_purchase_installments'::regclass
      AND conname = 'property_purchase_installments_client_id_fkey'
  ) THEN
    ALTER TABLE public.property_purchase_installments
      ADD CONSTRAINT property_purchase_installments_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS property_purchase_installments_property_idx
  ON public.property_purchase_installments (property_id, installment_number);
CREATE INDEX IF NOT EXISTS property_purchase_installments_due_idx
  ON public.property_purchase_installments (due_date)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS property_purchase_installments_user_idx
  ON public.property_purchase_installments (user_id);

ALTER TABLE public.property_purchase_installments ENABLE ROW LEVEL SECURITY;

-- Visível/editável por quem pode ver/escrever o imóvel pai (mesmo padrão de
-- 20260918000100_property_children_org_sharing.sql).
DROP POLICY IF EXISTS property_purchase_installments_select_via_property
  ON public.property_purchase_installments;
CREATE POLICY property_purchase_installments_select_via_property
  ON public.property_purchase_installments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_purchase_installments.property_id
        AND public.user_can_access_row(p.user_id, p.client_id)
    )
  );

-- INSERT exige autoria própria; UPDATE/DELETE valem para qualquer membro que
-- possa escrever no imóvel — senão um colega não consegue dar baixa numa parcela
-- lançada por outro.
DROP POLICY IF EXISTS property_purchase_installments_insert_via_property
  ON public.property_purchase_installments;
CREATE POLICY property_purchase_installments_insert_via_property
  ON public.property_purchase_installments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_purchase_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_purchase_installments_update_via_property
  ON public.property_purchase_installments;
CREATE POLICY property_purchase_installments_update_via_property
  ON public.property_purchase_installments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_purchase_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_purchase_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_purchase_installments_delete_via_property
  ON public.property_purchase_installments;
CREATE POLICY property_purchase_installments_delete_via_property
  ON public.property_purchase_installments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_purchase_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

-- Política antiga (FOR ALL) de execuções anteriores desta migration.
DROP POLICY IF EXISTS property_purchase_installments_write_via_property
  ON public.property_purchase_installments;

-- updated_at: mesmo helper usado pelo módulo de Contatos.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_property_purchase_installments_updated_at
  ON public.property_purchase_installments;
CREATE TRIGGER trg_property_purchase_installments_updated_at
  BEFORE UPDATE ON public.property_purchase_installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Geração do cronograma a partir das condições do imóvel
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_property_purchase_installments(
  p_property_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property public.properties%ROWTYPE;
  v_client_id uuid;
  v_count integer;
  v_financed numeric(15, 2);
  v_base numeric(15, 2);
  v_last numeric(15, 2);
  v_step interval;
  v_first_date date;
  v_down numeric(15, 2);
  v_generated integer := 0;
  v_inserted integer;
  n integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_property FROM public.properties WHERE id = p_property_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.user_can_write_row(v_property.user_id, v_property.client_id) THEN
    RAISE EXCEPTION 'Not authorized to change this property' USING ERRCODE = '42501';
  END IF;

  v_client_id := v_property.client_id;
  v_down := COALESCE(v_property.down_payment, 0);
  v_count := COALESCE(v_property.installments_count, 0);

  -- Parcelas pendentes são descartadas e remontadas; pagas e canceladas ficam.
  DELETE FROM public.property_purchase_installments
  WHERE property_id = p_property_id AND status = 'pending';

  -- Entrada (parcela 0), na data da compra quando houver.
  IF v_down > 0 THEN
    v_first_date := COALESCE(v_property.purchase_date, v_property.first_installment_date, CURRENT_DATE);

    INSERT INTO public.property_purchase_installments (
      property_id, user_id, client_id, installment_number, amount, due_date, metadata
    )
    VALUES (
      p_property_id, auth.uid(), v_client_id, 0, v_down, v_first_date,
      jsonb_build_object('kind', 'down_payment', 'generated_at', now())
    )
    ON CONFLICT (property_id, installment_number) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_generated := v_generated + v_inserted;
  END IF;

  IF v_count < 1 THEN
    RETURN v_generated;
  END IF;

  IF v_property.first_installment_date IS NULL THEN
    RAISE EXCEPTION 'Informe a data da primeira parcela' USING ERRCODE = 'P0001';
  END IF;

  -- Valor da parcela: o informado, ou o saldo financiado dividido pelo nº de parcelas.
  IF v_property.installment_amount IS NOT NULL AND v_property.installment_amount > 0 THEN
    v_base := v_property.installment_amount;
    v_last := v_property.installment_amount;
  ELSE
    v_financed := COALESCE(v_property.purchase_value, 0) - v_down;
    IF v_financed <= 0 THEN
      RAISE EXCEPTION 'Informe o valor de compra ou o valor da parcela' USING ERRCODE = 'P0001';
    END IF;
    v_base := round(v_financed / v_count, 2);
    -- A última parcela absorve a sobra do arredondamento.
    v_last := v_financed - (v_base * (v_count - 1));
  END IF;

  v_step := CASE COALESCE(v_property.installment_frequency, 'monthly')
    WHEN 'monthly' THEN interval '1 month'
    WHEN 'bimonthly' THEN interval '2 months'
    WHEN 'quarterly' THEN interval '3 months'
    WHEN 'semiannual' THEN interval '6 months'
    WHEN 'annual' THEN interval '1 year'
    ELSE interval '1 month'
  END;

  FOR n IN 1..v_count LOOP
    INSERT INTO public.property_purchase_installments (
      property_id, user_id, client_id, installment_number, amount, due_date, metadata
    )
    VALUES (
      p_property_id,
      auth.uid(),
      v_client_id,
      n,
      CASE WHEN n = v_count THEN v_last ELSE v_base END,
      (v_property.first_installment_date + (v_step * (n - 1)))::date,
      jsonb_build_object('kind', 'installment', 'generated_at', now())
    )
    -- Parcela desse número já existe e foi paga/cancelada: preserva.
    ON CONFLICT (property_id, installment_number) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_generated := v_generated + v_inserted;
  END LOOP;

  RETURN v_generated;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Baixa da parcela -> transação de despesa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_property_purchase_installment(
  p_installment_id uuid,
  p_paid_date date DEFAULT CURRENT_DATE,
  p_payment_method text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_installment public.property_purchase_installments%ROWTYPE;
  v_property_title text;
  v_category_id uuid;
  v_transaction_id uuid;
  v_paid_date date := COALESCE(p_paid_date, CURRENT_DATE);
  v_label text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_installment_id IS NULL THEN
    RAISE EXCEPTION 'installment id is required';
  END IF;

  SELECT * INTO v_installment
  FROM public.property_purchase_installments
  WHERE id = p_installment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Installment not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.user_can_write_row(v_installment.user_id, v_installment.client_id) THEN
    RAISE EXCEPTION 'Not authorized to record this installment' USING ERRCODE = '42501';
  END IF;

  IF v_installment.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot record a cancelled installment' USING ERRCODE = 'P0001';
  END IF;

  -- Já tem transação: só reafirma o status, sem duplicar a despesa.
  IF v_installment.financial_transaction_id IS NOT NULL THEN
    UPDATE public.property_purchase_installments
    SET status = 'paid',
        paid_date = v_paid_date,
        metadata = metadata || jsonb_build_object('recorded_by', auth.uid(), 'recorded_at', now()),
        updated_at = now()
    WHERE id = v_installment.id;

    RETURN v_installment.financial_transaction_id;
  END IF;

  SELECT title INTO v_property_title FROM public.properties WHERE id = v_installment.property_id;

  v_label := CASE
    WHEN v_installment.installment_number = 0
      THEN 'Entrada da compra - ' || COALESCE(v_property_title, 'imóvel')
    ELSE 'Parcela ' || v_installment.installment_number || ' da compra - ' || COALESCE(v_property_title, 'imóvel')
  END;

  -- Categoria de despesa: prefere uma de aquisição/compra já cadastrada.
  SELECT fc.id INTO v_category_id
  FROM public.financial_categories fc
  WHERE fc.type = 'expense'
    AND (fc.user_id = auth.uid() OR fc.user_id IS NULL)
  ORDER BY
    CASE
      WHEN lower(fc.name) LIKE '%aquisi%' THEN 0
      WHEN lower(fc.name) LIKE '%compra%' THEN 1
      WHEN lower(fc.name) LIKE '%financiamento%' THEN 2
      WHEN fc.is_default THEN 3
      ELSE 4
    END,
    CASE WHEN fc.user_id = auth.uid() THEN 0 ELSE 1 END,
    fc.name
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO public.financial_categories (user_id, name, type, is_default)
    VALUES (auth.uid(), 'Aquisição de Imóvel', 'expense', true)
    RETURNING id INTO v_category_id;
  END IF;

  INSERT INTO public.financial_transactions (
    user_id, name, amount, transaction_type, category, description,
    transaction_date, property_id, payment_method, recurring
  )
  VALUES (
    auth.uid(),
    v_label,
    v_installment.amount,
    'expense',
    v_category_id,
    'Baixa de parcela da aquisição do imóvel.',
    v_paid_date,
    v_installment.property_id,
    p_payment_method,
    false
  )
  RETURNING id INTO v_transaction_id;

  UPDATE public.property_purchase_installments
  SET status = 'paid',
      paid_date = v_paid_date,
      financial_transaction_id = v_transaction_id,
      metadata = metadata || jsonb_build_object('recorded_by', auth.uid(), 'recorded_at', now()),
      updated_at = now()
  WHERE id = v_installment.id;

  RETURN v_transaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_property_purchase_installments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_property_purchase_installment(uuid, date, text) TO authenticated;
