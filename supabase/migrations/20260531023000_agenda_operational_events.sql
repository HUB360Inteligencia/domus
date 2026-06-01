-- Agenda operacional: eventos manuais, lembretes internos e vinculos com dados do Domus.

CREATE TABLE IF NOT EXISTS public.agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  financial_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'appointment'
    CHECK (event_type IN ('appointment', 'task', 'maintenance', 'inspection', 'document', 'contract', 'payment', 'receipt', 'reminder', 'other')),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'activity', 'contract', 'financial', 'document', 'system')),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  all_day boolean NOT NULL DEFAULT true,
  amount numeric,
  cashflow_direction text CHECK (cashflow_direction IS NULL OR cashflow_direction IN ('receivable', 'payable')),
  recurrence_rule jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS public.agenda_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.agenda_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  offset_minutes integer NOT NULL DEFAULT 1440,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel = 'in_app'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agenda_events_user_starts_at
  ON public.agenda_events(user_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_agenda_events_user_status_starts_at
  ON public.agenda_events(user_id, status, starts_at);

CREATE INDEX IF NOT EXISTS idx_agenda_events_client_starts_at
  ON public.agenda_events(client_id, starts_at)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_events_property_starts_at
  ON public.agenda_events(property_id, starts_at)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_events_contract_id
  ON public.agenda_events(contract_id)
  WHERE contract_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_reminders_user_due
  ON public.agenda_reminders(user_id, status, remind_at);

CREATE INDEX IF NOT EXISTS idx_agenda_reminders_event_id
  ON public.agenda_reminders(event_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agenda_reminders_unique_schedule
  ON public.agenda_reminders(event_id, user_id, remind_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agenda_events_access_own_or_client ON public.agenda_events;
CREATE POLICY agenda_events_access_own_or_client ON public.agenda_events
  FOR ALL TO authenticated
  USING (public.user_can_access_row(user_id, client_id))
  WITH CHECK (public.user_can_access_row(user_id, client_id));

DROP POLICY IF EXISTS agenda_reminders_access_own ON public.agenda_reminders;
CREATE POLICY agenda_reminders_access_own ON public.agenda_reminders
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_access_own ON public.notifications;
CREATE POLICY notifications_access_own ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
