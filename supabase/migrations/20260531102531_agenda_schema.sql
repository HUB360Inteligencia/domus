CREATE TABLE IF NOT EXISTS public.agenda_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.client_users(client_id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
    contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
    financial_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
    activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    event_type text NOT NULL,
    source text NOT NULL,
    status text NOT NULL DEFAULT 'scheduled',
    priority text NOT NULL DEFAULT 'medium',
    starts_at timestamptz NOT NULL,
    ends_at timestamptz,
    all_day boolean NOT NULL DEFAULT false,
    amount numeric(15, 2),
    cashflow_direction text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agenda_reminders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.agenda_events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    remind_at timestamptz NOT NULL,
    offset_minutes integer NOT NULL,
    channel text NOT NULL DEFAULT 'in_app',
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own agenda events" ON public.agenda_events
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own agenda reminders" ON public.agenda_reminders
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
