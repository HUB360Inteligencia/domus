-- =============================================================================
-- Contas do imóvel (IPTU, condomínio, seguro...) + avisos de vencimento
--
-- Sugestão de usuário: "avisos de pagamento de IPTU, recebimento de aluguel".
-- Hoje IPTU só existe como categoria de transação: não há onde dizer quanto é,
-- em quantas parcelas, quando vence nem quem paga. E o sino de notificações só
-- avisa fim de contrato e lembretes manuais da agenda — aluguel atrasado e
-- parcela da compra vencendo passam em silêncio.
--
-- Solução:
--   1. `property_obligations`: a definição de uma conta recorrente do imóvel.
--      Genérica de propósito (IPTU, condomínio, seguro, ITR, taxa de lixo...):
--      todas são "valor X, vence em tais datas, alguém paga".
--   2. `property_obligation_installments`: um vencimento por linha, no mesmo
--      molde de `property_purchase_installments` (status, baixa, transação).
--   3. `generate_property_obligation_installments`: monta o calendário. Série
--      com nº fixo (IPTU 10x) gera tudo; série sem fim (condomínio) gera uma
--      janela de 12 meses que a varredura de avisos vai estendendo.
--   4. `record_property_obligation_payment`: dá baixa. Conta paga pelo
--      proprietário vira despesa; paga pelo inquilino só é confirmada.
--   5. `notifications.action_url`: o aviso leva direto à tela que resolve.
--   6. `process_property_due_alerts`: varredura idempotente que avisa aluguel a
--      receber/atrasado, parcela da compra e conta do imóvel a vencer/vencida,
--      e marca como lidos os avisos de itens já resolvidos.
--
-- Idempotente e defensiva (o banco remoto é atualizado manualmente e pode estar
-- atrás destes arquivos).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Helpers de formatação para as mensagens dos avisos
-- -----------------------------------------------------------------------------
-- to_char com ',' e '.' literais (não dependem de lc_numeric) e troca para o
-- padrão brasileiro: 1234.5 -> 'R$ 1.234,50'.
CREATE OR REPLACE FUNCTION public.domus_format_brl(p_value numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'R$ ' || translate(to_char(COALESCE(p_value, 0), 'FM999,999,999,990.00'), ',.', '.,');
$$;

-- "Hoje" do usuário: o servidor roda em UTC, e às 22h de Brasília já seria amanhã.
CREATE OR REPLACE FUNCTION public.domus_today()
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;
$$;

-- -----------------------------------------------------------------------------
-- 1. Definição da conta
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_obligations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  obligation_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  -- Exercício (IPTU 2027, ITR 2027). Opcional para contas sem ano, como condomínio.
  reference_year integer,
  -- 'once' = pagamento único (cota única). As demais repetem a cada período.
  frequency text NOT NULL DEFAULT 'monthly',
  -- NULL = série sem fim (condomínio, seguro renovável); senão, nº de parcelas.
  installments_count integer,
  -- Valor de cada vencimento. Se nulo numa série com nº fixo, deriva de total / nº.
  installment_amount numeric(15, 2),
  total_amount numeric(15, 2),
  first_due_date date NOT NULL,
  -- Último vencimento possível de uma série sem fim.
  end_date date,
  -- Quem paga: o proprietário (vira despesa) ou o inquilino (só confirmação).
  paid_by text NOT NULL DEFAULT 'owner',
  -- Antecedência do aviso, em dias.
  reminder_days integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'active',
  creditor_name text,
  -- Inscrição imobiliária, nº da apólice, código do carnê...
  reference_code text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_obligations_type_check CHECK (obligation_type IN (
    'iptu', 'condo', 'insurance', 'itr', 'waste_fee', 'utility', 'other'
  )),
  CONSTRAINT property_obligations_frequency_check CHECK (frequency IN (
    'once', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'
  )),
  CONSTRAINT property_obligations_count_check
    CHECK (installments_count IS NULL OR installments_count BETWEEN 1 AND 600),
  CONSTRAINT property_obligations_amount_check CHECK (
    COALESCE(installment_amount, 0) > 0 OR COALESCE(total_amount, 0) > 0
  ),
  CONSTRAINT property_obligations_paid_by_check CHECK (paid_by IN ('owner', 'tenant')),
  CONSTRAINT property_obligations_reminder_check CHECK (reminder_days BETWEEN 0 AND 90),
  CONSTRAINT property_obligations_status_check CHECK (status IN ('active', 'paused', 'closed')),
  CONSTRAINT property_obligations_end_date_check CHECK (end_date IS NULL OR end_date >= first_due_date)
);

-- -----------------------------------------------------------------------------
-- 2. Vencimentos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_obligation_installments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  obligation_id uuid NOT NULL REFERENCES public.property_obligations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid,
  financial_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  installment_number integer NOT NULL,
  amount numeric(15, 2) NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  -- Valor efetivamente pago (juros, multa ou desconto de cota única).
  paid_amount numeric(15, 2),
  status text NOT NULL DEFAULT 'pending',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_obligation_installments_status_check
    CHECK (status IN ('pending', 'paid', 'cancelled')),
  CONSTRAINT property_obligation_installments_number_check CHECK (installment_number >= 1),
  CONSTRAINT property_obligation_installments_amount_check CHECK (amount >= 0),
  CONSTRAINT property_obligation_installments_unique_number UNIQUE (obligation_id, installment_number)
);

-- FK de client_id só quando a tabela alvo existir (bancos antigos podem não ter).
DO $$
BEGIN
  IF to_regclass('public.clients') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.property_obligations'::regclass
      AND conname = 'property_obligations_client_id_fkey'
  ) THEN
    ALTER TABLE public.property_obligations
      ADD CONSTRAINT property_obligations_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.property_obligation_installments'::regclass
      AND conname = 'property_obligation_installments_client_id_fkey'
  ) THEN
    ALTER TABLE public.property_obligation_installments
      ADD CONSTRAINT property_obligation_installments_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS property_obligations_property_idx
  ON public.property_obligations (property_id);
CREATE INDEX IF NOT EXISTS property_obligations_active_open_idx
  ON public.property_obligations (property_id)
  WHERE status = 'active' AND installments_count IS NULL;
CREATE INDEX IF NOT EXISTS property_obligation_installments_obligation_idx
  ON public.property_obligation_installments (obligation_id, installment_number);
CREATE INDEX IF NOT EXISTS property_obligation_installments_property_due_idx
  ON public.property_obligation_installments (property_id, due_date);
CREATE INDEX IF NOT EXISTS property_obligation_installments_pending_due_idx
  ON public.property_obligation_installments (due_date)
  WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- RLS: visível/editável por quem vê/escreve o imóvel (mesmo padrão das parcelas
-- da compra). INSERT exige autoria própria; UPDATE/DELETE valem para qualquer
-- membro que escreva no imóvel, para um colega poder dar baixa.
-- -----------------------------------------------------------------------------
ALTER TABLE public.property_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_obligation_installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS property_obligations_select_via_property ON public.property_obligations;
CREATE POLICY property_obligations_select_via_property
  ON public.property_obligations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligations.property_id
        AND public.user_can_access_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_obligations_insert_via_property ON public.property_obligations;
CREATE POLICY property_obligations_insert_via_property
  ON public.property_obligations FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligations.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_obligations_update_via_property ON public.property_obligations;
CREATE POLICY property_obligations_update_via_property
  ON public.property_obligations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligations.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligations.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_obligations_delete_via_property ON public.property_obligations;
CREATE POLICY property_obligations_delete_via_property
  ON public.property_obligations FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligations.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_obligation_installments_select_via_property
  ON public.property_obligation_installments;
CREATE POLICY property_obligation_installments_select_via_property
  ON public.property_obligation_installments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligation_installments.property_id
        AND public.user_can_access_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_obligation_installments_insert_via_property
  ON public.property_obligation_installments;
CREATE POLICY property_obligation_installments_insert_via_property
  ON public.property_obligation_installments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligation_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_obligation_installments_update_via_property
  ON public.property_obligation_installments;
CREATE POLICY property_obligation_installments_update_via_property
  ON public.property_obligation_installments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligation_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligation_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
    )
  );

DROP POLICY IF EXISTS property_obligation_installments_delete_via_property
  ON public.property_obligation_installments;
CREATE POLICY property_obligation_installments_delete_via_property
  ON public.property_obligation_installments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_obligation_installments.property_id
        AND public.user_can_write_row(p.user_id, p.client_id)
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

DROP TRIGGER IF EXISTS trg_property_obligations_updated_at ON public.property_obligations;
CREATE TRIGGER trg_property_obligations_updated_at
  BEFORE UPDATE ON public.property_obligations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_property_obligation_installments_updated_at
  ON public.property_obligation_installments;
CREATE TRIGGER trg_property_obligation_installments_updated_at
  BEFORE UPDATE ON public.property_obligation_installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.property_obligations IS
  'Conta recorrente do imóvel (IPTU, condomínio, seguro, ITR...). O calendário fica em property_obligation_installments.';
COMMENT ON COLUMN public.property_obligations.installments_count IS
  'Nº de parcelas. NULL = série sem fim, gerada numa janela de 12 meses estendida pela varredura de avisos.';
COMMENT ON COLUMN public.property_obligations.paid_by IS
  'owner: a baixa vira despesa no financeiro. tenant: a baixa só confirma que o inquilino pagou.';

-- -----------------------------------------------------------------------------
-- 3. Geração do calendário
-- -----------------------------------------------------------------------------
-- p_rebuild = true descarta os vencimentos em aberto e remonta (edição da conta).
-- p_rebuild = false só acrescenta os que faltam (extensão da janela de séries sem fim).
-- Vencimentos pagos ou cancelados nunca são tocados.
CREATE OR REPLACE FUNCTION public.generate_property_obligation_installments(
  p_obligation_id uuid,
  p_rebuild boolean DEFAULT true
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_obligation public.property_obligations%ROWTYPE;
  v_property public.properties%ROWTYPE;
  v_count integer;
  v_limit date;
  v_step interval;
  v_base numeric(15, 2);
  v_last numeric(15, 2);
  v_due date;
  v_generated integer := 0;
  v_inserted integer;
  n integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_obligation
  FROM public.property_obligations
  WHERE id = p_obligation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Obligation not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_property FROM public.properties WHERE id = v_obligation.property_id;
  IF NOT FOUND OR NOT public.user_can_write_row(v_property.user_id, v_property.client_id) THEN
    RAISE EXCEPTION 'Not authorized to change this property' USING ERRCODE = '42501';
  END IF;

  IF p_rebuild THEN
    DELETE FROM public.property_obligation_installments
    WHERE obligation_id = p_obligation_id AND status = 'pending';
  END IF;

  -- Pausada ou encerrada: não ganha vencimentos novos (os existentes ficam).
  IF v_obligation.status <> 'active' THEN
    RETURN 0;
  END IF;

  v_count := CASE
    WHEN v_obligation.frequency = 'once' THEN 1
    ELSE v_obligation.installments_count
  END;

  v_step := CASE v_obligation.frequency
    WHEN 'monthly' THEN interval '1 month'
    WHEN 'bimonthly' THEN interval '2 months'
    WHEN 'quarterly' THEN interval '3 months'
    WHEN 'semiannual' THEN interval '6 months'
    WHEN 'annual' THEN interval '1 year'
    ELSE interval '1 month'
  END;

  IF v_count IS NOT NULL THEN
    IF COALESCE(v_obligation.installment_amount, 0) > 0 THEN
      v_base := v_obligation.installment_amount;
      v_last := v_obligation.installment_amount;
    ELSIF COALESCE(v_obligation.total_amount, 0) > 0 THEN
      v_base := round(v_obligation.total_amount / v_count, 2);
      -- A última parcela absorve a sobra do arredondamento.
      v_last := v_obligation.total_amount - (v_base * (v_count - 1));
    ELSE
      RAISE EXCEPTION 'Informe o valor total ou o valor de cada parcela' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    IF COALESCE(v_obligation.installment_amount, 0) <= 0 THEN
      RAISE EXCEPTION 'Informe o valor de cada vencimento' USING ERRCODE = 'P0001';
    END IF;
    v_base := v_obligation.installment_amount;
    v_last := v_obligation.installment_amount;
    v_limit := LEAST(
      COALESCE(v_obligation.end_date, 'infinity'::date),
      (public.domus_today() + interval '12 months')::date
    );
  END IF;

  LOOP
    n := n + 1;
    EXIT WHEN v_count IS NOT NULL AND n > v_count;
    -- Trava de segurança: 50 anos de mensalidades.
    EXIT WHEN n > 600;

    -- Sempre a partir do 1º vencimento: 31/01 + 1 mês = 28/02, e + 2 meses volta a 31/03.
    v_due := (v_obligation.first_due_date + (v_step * (n - 1)))::date;
    EXIT WHEN v_count IS NULL AND v_due > v_limit;

    INSERT INTO public.property_obligation_installments (
      obligation_id, property_id, user_id, client_id, installment_number, amount, due_date, metadata
    )
    VALUES (
      p_obligation_id,
      v_obligation.property_id,
      auth.uid(),
      v_property.client_id,
      n,
      CASE WHEN v_count IS NOT NULL AND n = v_count THEN v_last ELSE v_base END,
      v_due,
      jsonb_build_object('generated_at', now())
    )
    ON CONFLICT (obligation_id, installment_number) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_generated := v_generated + v_inserted;
  END LOOP;

  RETURN v_generated;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Baixa do vencimento
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_property_obligation_payment(
  p_installment_id uuid,
  p_paid_date date DEFAULT NULL,
  p_paid_amount numeric DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_create_transaction boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_installment public.property_obligation_installments%ROWTYPE;
  v_obligation public.property_obligations%ROWTYPE;
  v_property public.properties%ROWTYPE;
  v_paid_date date := COALESCE(p_paid_date, public.domus_today());
  v_amount numeric(15, 2);
  v_label text;
  v_candidates text[];
  v_category_id uuid;
  v_transaction_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_installment_id IS NULL THEN
    RAISE EXCEPTION 'installment id is required';
  END IF;

  SELECT * INTO v_installment
  FROM public.property_obligation_installments
  WHERE id = p_installment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Installment not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_property FROM public.properties WHERE id = v_installment.property_id;
  IF NOT FOUND OR NOT public.user_can_write_row(v_property.user_id, v_property.client_id) THEN
    RAISE EXCEPTION 'Not authorized to record this payment' USING ERRCODE = '42501';
  END IF;

  IF v_installment.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot record a cancelled installment' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_obligation FROM public.property_obligations WHERE id = v_installment.obligation_id;

  v_amount := COALESCE(NULLIF(p_paid_amount, 0), v_installment.amount);
  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Informe o valor pago' USING ERRCODE = 'P0001';
  END IF;

  -- Já tem despesa lançada: só reafirma, sem duplicar.
  IF v_installment.financial_transaction_id IS NOT NULL THEN
    UPDATE public.property_obligation_installments
    SET status = 'paid',
        paid_date = v_paid_date,
        metadata = metadata || jsonb_build_object('recorded_by', auth.uid(), 'recorded_at', now()),
        updated_at = now()
    WHERE id = v_installment.id;

    v_transaction_id := v_installment.financial_transaction_id;
  ELSIF v_obligation.paid_by = 'tenant' OR NOT COALESCE(p_create_transaction, true) THEN
    -- Pago pelo inquilino (ou baixa de algo já lançado à mão): só confirma.
    UPDATE public.property_obligation_installments
    SET status = 'paid',
        paid_date = v_paid_date,
        paid_amount = v_amount,
        metadata = metadata || jsonb_build_object(
          'recorded_by', auth.uid(),
          'recorded_at', now(),
          'without_transaction', true,
          'paid_by', v_obligation.paid_by
        ),
        updated_at = now()
    WHERE id = v_installment.id;

    v_transaction_id := NULL;
  ELSE
    v_label := v_obligation.title || ' - ' ||
      CASE
        WHEN COALESCE(v_obligation.installments_count, 0) > 1
          THEN 'parcela ' || v_installment.installment_number || '/' || v_obligation.installments_count
        ELSE to_char(v_installment.due_date, 'MM/YYYY')
      END ||
      ' - ' || COALESCE(v_property.title, 'imóvel');

    -- Categoria de despesa pelo tipo da conta, preferindo as padrão do sistema.
    v_candidates := CASE v_obligation.obligation_type
      WHEN 'iptu' THEN ARRAY['iptu', 'impostos']
      WHEN 'condo' THEN ARRAY['taxa de condomínio', 'condomínio']
      WHEN 'insurance' THEN ARRAY['seguro']
      WHEN 'itr' THEN ARRAY['itr', 'impostos']
      WHEN 'waste_fee' THEN ARRAY['taxa de lixo', 'impostos']
      WHEN 'utility' THEN ARRAY['contas de consumo', 'outros']
      ELSE ARRAY['outros']
    END;

    SELECT fc.id INTO v_category_id
    FROM public.financial_categories fc
    WHERE fc.type = 'expense'
      AND (fc.user_id = auth.uid() OR fc.user_id IS NULL)
      AND lower(fc.name) = ANY (v_candidates)
    ORDER BY
      array_position(v_candidates, lower(fc.name)),
      CASE WHEN fc.user_id = auth.uid() THEN 0 ELSE 1 END
    LIMIT 1;

    IF v_category_id IS NULL THEN
      INSERT INTO public.financial_categories (user_id, name, type, is_default)
      VALUES (
        auth.uid(),
        CASE v_obligation.obligation_type
          WHEN 'iptu' THEN 'IPTU'
          WHEN 'condo' THEN 'Taxa de Condomínio'
          WHEN 'insurance' THEN 'Seguro'
          WHEN 'itr' THEN 'ITR'
          WHEN 'waste_fee' THEN 'Taxa de Lixo'
          WHEN 'utility' THEN 'Contas de Consumo'
          ELSE 'Outros'
        END,
        'expense',
        false
      )
      RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO public.financial_transactions (
      user_id, name, amount, transaction_type, category, description,
      transaction_date, property_id, payment_method, recurring
    )
    VALUES (
      auth.uid(),
      v_label,
      v_amount,
      'expense',
      v_category_id,
      'Baixa de conta do imóvel registrada pelo Domus.',
      v_paid_date,
      v_installment.property_id,
      p_payment_method,
      false
    )
    RETURNING id INTO v_transaction_id;

    UPDATE public.property_obligation_installments
    SET status = 'paid',
        paid_date = v_paid_date,
        paid_amount = v_amount,
        financial_transaction_id = v_transaction_id,
        metadata = metadata || jsonb_build_object('recorded_by', auth.uid(), 'recorded_at', now()),
        updated_at = now()
    WHERE id = v_installment.id;
  END IF;

  -- O aviso desse vencimento deixa de ser pendência para todos da organização.
  UPDATE public.notifications
  SET is_read = true
  WHERE related_to = 'obligation_installment'
    AND related_id::text = v_installment.id::text
    AND is_read = false;

  RETURN v_transaction_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Link de ação nos avisos
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url text;

  -- Já criado em 20260531113000; repetido aqui porque a varredura depende dele
  -- e o banco remoto pode estar atrás. Com duplicatas antigas a criação falha —
  -- os inserts da varredura também se protegem com NOT EXISTS.
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_related_user_type
      ON public.notifications(user_id, related_to, related_id, type)
      WHERE related_to IS NOT NULL AND related_id IS NOT NULL;
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Avisos duplicados impedem o índice único de notifications; a varredura segue protegida por NOT EXISTS.';
  END;
END $$;

COMMENT ON COLUMN public.notifications.action_url IS
  'Rota do app que resolve o aviso (ex.: /properties/<id>?tab=obligations). Tem prioridade sobre related_to.';

-- -----------------------------------------------------------------------------
-- 6. Varredura de vencimentos
-- -----------------------------------------------------------------------------
-- Roda com o usuário logado (o app chama ao abrir). Avisa só o próprio usuário,
-- sobre o que ele pode ver. O índice único (user_id, related_to, related_id, type)
-- garante um aviso "a vencer" (warning) e um "vencido" (error) por item, no máximo.
CREATE OR REPLACE FUNCTION public.process_property_due_alerts(
  p_days_ahead integer DEFAULT 5
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := public.domus_today();
  v_horizon date;
  -- Atraso muito antigo não volta a incomodar: é dado de histórico, não pendência.
  v_overdue_floor date := public.domus_today() - 60;
  v_total integer := 0;
  v_inserted integer;
  r record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_horizon := v_today + GREATEST(COALESCE(p_days_ahead, 5), 0);

  -- 6.1 Estende a janela das contas sem fim (condomínio, seguro renovável).
  FOR r IN
    SELECT o.id
    FROM public.property_obligations o
    JOIN public.properties p ON p.id = o.property_id
    WHERE o.status = 'active'
      AND o.installments_count IS NULL
      AND o.frequency <> 'once'
      AND public.user_can_write_row(p.user_id, p.client_id)
  LOOP
    BEGIN
      PERFORM public.generate_property_obligation_installments(r.id, false);
    EXCEPTION WHEN OTHERS THEN
      -- Uma conta mal configurada não pode impedir os avisos das demais.
      RAISE NOTICE 'Falha ao estender a conta %: %', r.id, SQLERRM;
    END;
  END LOOP;

  -- 6.2 Garante as previsões de aluguel da janela (mesma rotina da Agenda).
  BEGIN
    PERFORM public.generate_contract_expected_payments(
      date_trunc('month', v_overdue_floor)::date,
      date_trunc('month', v_horizon)::date
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Falha ao gerar previsões de aluguel: %', SQLERRM;
  END;

  -- 6.3 Aluguel a receber / em atraso. Recebimento lançado à mão (receita do
  -- mesmo imóvel, mesmo mês, mesmo valor) conta como recebido, como na Agenda.
  INSERT INTO public.notifications (
    user_id, title, message, type, related_to, related_id, is_read, action_url
  )
  SELECT
    v_uid,
    CASE
      WHEN due.due_date < v_today THEN 'Aluguel em atraso'
      WHEN due.due_date = v_today THEN 'Aluguel vence hoje'
      ELSE 'Aluguel a receber'
    END,
    CASE
      WHEN due.due_date < v_today THEN
        'O aluguel de ' || public.domus_format_brl(due.amount) || ' (' || due.label || ')' ||
        COALESCE(' de ' || due.tenant_name, '') ||
        ' venceu em ' || to_char(due.due_date, 'DD/MM/YYYY') || ' e ainda não foi baixado.'
      ELSE
        'Recebimento de ' || public.domus_format_brl(due.amount) || ' (' || due.label || ')' ||
        COALESCE(' de ' || due.tenant_name, '') ||
        ' previsto para ' || to_char(due.due_date, 'DD/MM/YYYY') || '.'
    END,
    CASE WHEN due.due_date < v_today THEN 'error' ELSE 'warning' END,
    'rent_payment',
    due.id,
    false,
    '/contracts/' || due.contract_id
  FROM (
    SELECT
      cep.id,
      cep.contract_id,
      cep.amount,
      cep.expected_due_date AS due_date,
      COALESCE(p.title, c.title, 'contrato') AS label,
      NULLIF(btrim(c.tenant_name), '') AS tenant_name
    FROM public.contract_expected_payments cep
    JOIN public.contracts c ON c.id = cep.contract_id
    LEFT JOIN public.properties p ON p.id = cep.property_id
    WHERE cep.status = 'expected'
      AND c.status = 'active'
      AND cep.expected_due_date BETWEEN v_overdue_floor AND v_horizon
      AND public.user_can_access_row(cep.user_id, cep.client_id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.financial_transactions ft
        WHERE ft.transaction_type = 'income'
          AND ft.property_id IS NOT DISTINCT FROM cep.property_id
          AND date_trunc('month', ft.transaction_date) = date_trunc('month', cep.expected_due_date)
          AND abs(ft.amount - cep.amount) < 0.02
      )
  ) AS due
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = v_uid
      AND n.related_to = 'rent_payment'
      AND n.related_id::text = due.id::text
      AND n.type = CASE WHEN due.due_date < v_today THEN 'error' ELSE 'warning' END
  )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_total := v_total + v_inserted;

  -- 6.4 Parcela da compra do imóvel.
  INSERT INTO public.notifications (
    user_id, title, message, type, related_to, related_id, is_read, action_url
  )
  SELECT
    v_uid,
    CASE
      WHEN i.due_date < v_today THEN 'Parcela da compra vencida'
      WHEN i.due_date = v_today THEN 'Parcela da compra vence hoje'
      ELSE 'Parcela da compra a vencer'
    END,
    CASE WHEN i.installment_number = 0 THEN 'Entrada' ELSE 'Parcela ' || i.installment_number END ||
      ' de ' || public.domus_format_brl(i.amount) || ' (' || COALESCE(p.title, 'imóvel') || ')' ||
      CASE
        WHEN i.due_date < v_today THEN ' venceu em ' || to_char(i.due_date, 'DD/MM/YYYY') || ' e ainda não foi baixada.'
        ELSE ' vence em ' || to_char(i.due_date, 'DD/MM/YYYY') || '.'
      END,
    CASE WHEN i.due_date < v_today THEN 'error' ELSE 'warning' END,
    'purchase_installment',
    i.id,
    false,
    '/properties/' || i.property_id || '?tab=financial'
  FROM public.property_purchase_installments i
  JOIN public.properties p ON p.id = i.property_id
  WHERE i.status = 'pending'
    AND i.due_date BETWEEN v_overdue_floor AND v_horizon
    AND public.user_can_access_row(p.user_id, p.client_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = v_uid
        AND n.related_to = 'purchase_installment'
        AND n.related_id::text = i.id::text
        AND n.type = CASE WHEN i.due_date < v_today THEN 'error' ELSE 'warning' END
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_total := v_total + v_inserted;

  -- 6.5 Contas do imóvel, com a antecedência configurada em cada uma.
  INSERT INTO public.notifications (
    user_id, title, message, type, related_to, related_id, is_read, action_url
  )
  SELECT
    v_uid,
    CASE
      WHEN o.paid_by = 'tenant' AND i.due_date < v_today THEN o.title || ': confirme o pagamento'
      WHEN o.paid_by = 'tenant' THEN o.title || ': vence com o inquilino'
      WHEN i.due_date < v_today THEN o.title || ' vencido'
      WHEN i.due_date = v_today THEN o.title || ' vence hoje'
      ELSE o.title || ' a vencer'
    END,
    CASE
      WHEN COALESCE(o.installments_count, 0) > 1
        THEN 'Parcela ' || i.installment_number || '/' || o.installments_count || ' de '
      ELSE 'Vencimento de '
    END ||
      public.domus_format_brl(i.amount) || ' (' || COALESCE(p.title, 'imóvel') || ')' ||
      CASE
        WHEN i.due_date < v_today THEN ' venceu em ' || to_char(i.due_date, 'DD/MM/YYYY')
        ELSE ' em ' || to_char(i.due_date, 'DD/MM/YYYY')
      END ||
      CASE
        WHEN o.paid_by = 'tenant' THEN '. Pago pelo inquilino: confirme que foi quitado.'
        WHEN i.due_date < v_today THEN ' e ainda não foi baixado.'
        ELSE '.'
      END,
    CASE WHEN i.due_date < v_today THEN 'error' ELSE 'warning' END,
    'obligation_installment',
    i.id,
    false,
    '/properties/' || i.property_id || '?tab=obligations'
  FROM public.property_obligation_installments i
  JOIN public.property_obligations o ON o.id = i.obligation_id
  JOIN public.properties p ON p.id = i.property_id
  WHERE i.status = 'pending'
    AND o.status <> 'closed'
    AND i.due_date >= v_overdue_floor
    AND i.due_date <= v_today + o.reminder_days
    AND public.user_can_access_row(p.user_id, p.client_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = v_uid
        AND n.related_to = 'obligation_installment'
        AND n.related_id::text = i.id::text
        AND n.type = CASE WHEN i.due_date < v_today THEN 'error' ELSE 'warning' END
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_total := v_total + v_inserted;

  -- 6.6 Avisos de itens já resolvidos (pagos, cancelados, excluídos) param de
  -- contar como não lidos — senão o sino acusa pendência que não existe mais.
  UPDATE public.notifications n
  SET is_read = true
  WHERE n.user_id = v_uid
    AND n.is_read = false
    AND n.related_to = 'rent_payment'
    AND NOT EXISTS (
      SELECT 1 FROM public.contract_expected_payments cep
      WHERE cep.id::text = n.related_id::text
        AND cep.status = 'expected'
        AND NOT EXISTS (
          SELECT 1
          FROM public.financial_transactions ft
          WHERE ft.transaction_type = 'income'
            AND ft.property_id IS NOT DISTINCT FROM cep.property_id
            AND date_trunc('month', ft.transaction_date) = date_trunc('month', cep.expected_due_date)
            AND abs(ft.amount - cep.amount) < 0.02
        )
    );

  UPDATE public.notifications n
  SET is_read = true
  WHERE n.user_id = v_uid
    AND n.is_read = false
    AND n.related_to = 'purchase_installment'
    AND NOT EXISTS (
      SELECT 1 FROM public.property_purchase_installments i
      WHERE i.id::text = n.related_id::text AND i.status = 'pending'
    );

  UPDATE public.notifications n
  SET is_read = true
  WHERE n.user_id = v_uid
    AND n.is_read = false
    AND n.related_to = 'obligation_installment'
    AND NOT EXISTS (
      SELECT 1 FROM public.property_obligation_installments i
      WHERE i.id::text = n.related_id::text AND i.status = 'pending'
    );

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.domus_format_brl(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.domus_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_property_obligation_installments(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_property_obligation_payment(uuid, date, numeric, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_property_due_alerts(integer) TO authenticated;
