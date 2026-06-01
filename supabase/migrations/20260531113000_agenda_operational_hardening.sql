-- Agenda hardening: previsoes idempotentes de contratos e lembretes internos.

CREATE TABLE IF NOT EXISTS public.contract_expected_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  reference_month date NOT NULL,
  expected_due_date date NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'expected'
    CHECK (status IN ('expected', 'paid', 'cancelled')),
  source text NOT NULL DEFAULT 'contract_schedule'
    CHECK (source = 'contract_schedule'),
  financial_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, reference_month, source)
);

CREATE INDEX IF NOT EXISTS idx_contract_expected_payments_user_due
  ON public.contract_expected_payments(user_id, expected_due_date);

CREATE INDEX IF NOT EXISTS idx_contract_expected_payments_client_due
  ON public.contract_expected_payments(client_id, expected_due_date)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_expected_payments_property_due
  ON public.contract_expected_payments(property_id, expected_due_date)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_expected_payments_contract_month
  ON public.contract_expected_payments(contract_id, reference_month);

ALTER TABLE public.contract_expected_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_expected_payments_access_own_or_client ON public.contract_expected_payments;
CREATE POLICY contract_expected_payments_access_own_or_client ON public.contract_expected_payments
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS "Users can manage their own agenda events" ON public.agenda_events;
DROP POLICY IF EXISTS "Users can manage their own agenda reminders" ON public.agenda_reminders;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_related_user_type
  ON public.notifications(user_id, related_to, related_id, type)
  WHERE related_to IS NOT NULL AND related_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_contract_expected_payments(
  p_from_month date,
  p_through_month date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_from_month IS NULL OR p_through_month IS NULL THEN
    RAISE EXCEPTION 'month range is required';
  END IF;

  WITH months AS (
    SELECT generate_series(
      date_trunc('month', p_from_month)::date,
      date_trunc('month', p_through_month)::date,
      interval '1 month'
    )::date AS reference_month
  ),
  due_rows AS (
    SELECT
      c.user_id,
      c.client_id,
      c.id AS contract_id,
      c.property_id,
      m.reference_month,
      (
        m.reference_month
        + (LEAST(
            COALESCE(c.payment_due_day, c.payment_day),
            EXTRACT(day FROM (date_trunc('month', m.reference_month) + interval '1 month - 1 day'))::integer
          ) - 1) * interval '1 day'
      )::date AS expected_due_date,
      c.value AS amount,
      jsonb_build_object(
        'tenant_name', c.tenant_name,
        'contract_title', c.title,
        'payment_day', COALESCE(c.payment_due_day, c.payment_day)
      ) AS metadata
    FROM public.contracts c
    JOIN months m
      ON m.reference_month BETWEEN date_trunc('month', c.start_date)::date
      AND date_trunc('month', c.end_date)::date
    WHERE c.status = 'active'
      AND public.user_can_access_row(c.user_id, c.client_id)
  ),
  upserted AS (
    INSERT INTO public.contract_expected_payments (
      user_id,
      client_id,
      contract_id,
      property_id,
      reference_month,
      expected_due_date,
      amount,
      metadata
    )
    SELECT
      user_id,
      client_id,
      contract_id,
      property_id,
      reference_month,
      expected_due_date,
      amount,
      metadata
    FROM due_rows
    ON CONFLICT (contract_id, reference_month, source) DO UPDATE SET
      expected_due_date = EXCLUDED.expected_due_date,
      amount = EXCLUDED.amount,
      property_id = EXCLUDED.property_id,
      client_id = EXCLUDED.client_id,
      metadata = EXCLUDED.metadata,
      updated_at = now()
    RETURNING id
  )
  SELECT count(*) INTO v_inserted FROM upserted;

  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_due_agenda_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  WITH due AS (
    SELECT
      r.id AS reminder_id,
      r.user_id,
      e.id AS event_id,
      e.title,
      e.starts_at
    FROM public.agenda_reminders r
    JOIN public.agenda_events e ON e.id = r.event_id
    WHERE r.user_id = auth.uid()
      AND r.status = 'pending'
      AND r.channel = 'in_app'
      AND r.remind_at <= now()
      AND public.user_can_access_row(e.user_id, e.client_id)
  ),
  inserted AS (
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_to,
      related_id,
      is_read
    )
    SELECT
      user_id,
      'Lembrete da agenda',
      'Evento "' || title || '" agendado para ' || to_char(starts_at, 'DD/MM/YYYY HH24:MI') || '.',
      'info',
      'agenda_event',
      event_id,
      false
    FROM due
    ON CONFLICT DO NOTHING
    RETURNING related_id
  ),
  updated AS (
    UPDATE public.agenda_reminders r
    SET status = 'sent'
    FROM due
    WHERE r.id = due.reminder_id
    RETURNING r.id
  )
  SELECT count(*) INTO v_processed FROM updated;

  RETURN v_processed;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_expected_contract_payment(
  p_expected_payment_id uuid,
  p_paid_date date DEFAULT CURRENT_DATE,
  p_payment_method text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.contract_expected_payments%ROWTYPE;
  v_category_id uuid;
  v_transaction_id uuid;
  v_contract_title text;
  v_property_title text;
  v_paid_date date := COALESCE(p_paid_date, CURRENT_DATE);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_expected_payment_id IS NULL THEN
    RAISE EXCEPTION 'expected payment id is required';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.contract_expected_payments
  WHERE id = p_expected_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expected payment not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.user_can_access_row(v_payment.user_id, v_payment.client_id) THEN
    RAISE EXCEPTION 'Not authorized to record this payment' USING ERRCODE = '42501';
  END IF;

  IF v_payment.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot record a cancelled expected payment' USING ERRCODE = 'P0001';
  END IF;

  IF v_payment.financial_transaction_id IS NOT NULL THEN
    UPDATE public.contract_expected_payments
    SET
      status = 'paid',
      metadata = metadata || jsonb_build_object(
        'paid_date', v_paid_date,
        'paid_at', now(),
        'recorded_by', auth.uid(),
        'recorded_via', 'agenda'
      ),
      updated_at = now()
    WHERE id = v_payment.id;

    RETURN v_payment.financial_transaction_id;
  END IF;

  SELECT c.title, p.title
  INTO v_contract_title, v_property_title
  FROM public.contracts c
  LEFT JOIN public.properties p ON p.id = c.property_id
  WHERE c.id = v_payment.contract_id;

  SELECT ft.id
  INTO v_transaction_id
  FROM public.financial_transactions ft
  WHERE ft.user_id = auth.uid()
    AND ft.transaction_type = 'income'
    AND ft.property_id IS NOT DISTINCT FROM v_payment.property_id
    AND date_trunc('month', ft.transaction_date)::date = date_trunc('month', v_payment.expected_due_date)::date
    AND abs(ft.amount - v_payment.amount) < 0.02
  ORDER BY ft.transaction_date DESC, ft.created_at DESC
  LIMIT 1;

  IF v_transaction_id IS NULL THEN
    SELECT fc.id
    INTO v_category_id
    FROM public.financial_categories fc
    WHERE fc.type = 'income'
      AND (fc.user_id = auth.uid() OR fc.user_id IS NULL)
    ORDER BY
      CASE
        WHEN lower(fc.name) = 'aluguel' THEN 0
        WHEN lower(fc.name) LIKE '%aluguel%' THEN 1
        WHEN fc.is_default THEN 2
        ELSE 3
      END,
      CASE WHEN fc.user_id = auth.uid() THEN 0 ELSE 1 END,
      fc.name
    LIMIT 1;

    IF v_category_id IS NULL THEN
      INSERT INTO public.financial_categories (
        user_id,
        name,
        type,
        is_default
      )
      VALUES (
        auth.uid(),
        'Aluguel',
        'income',
        true
      )
      RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO public.financial_transactions (
      user_id,
      name,
      amount,
      transaction_type,
      category,
      description,
      transaction_date,
      property_id,
      payment_method,
      recurring
    )
    VALUES (
      auth.uid(),
      'Recebimento de aluguel - ' || COALESCE(v_property_title, v_contract_title, to_char(v_payment.reference_month, 'MM/YYYY')),
      v_payment.amount,
      'income',
      v_category_id,
      'Baixa registrada pela Agenda Domus para previsao do contrato.',
      v_paid_date,
      v_payment.property_id,
      p_payment_method,
      false
    )
    RETURNING id INTO v_transaction_id;
  END IF;

  UPDATE public.contract_expected_payments
  SET
    status = 'paid',
    financial_transaction_id = v_transaction_id,
    metadata = metadata || jsonb_build_object(
      'paid_date', v_paid_date,
      'paid_at', now(),
      'recorded_by', auth.uid(),
      'recorded_via', 'agenda'
    ),
    updated_at = now()
  WHERE id = v_payment.id;

  RETURN v_transaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_contract_expected_payments(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_due_agenda_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_expected_contract_payment(uuid, date, text) TO authenticated;
