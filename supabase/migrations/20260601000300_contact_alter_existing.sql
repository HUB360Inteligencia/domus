-- Módulo Contatos — vínculos opcionais com módulos existentes.
-- Todas as colunas são NULLABLE e aditivas: nenhum fluxo existente é alterado.
--   * contracts.primary_contact_id      -> contato principal (atalho; N:N em contact_contract_links)
--   * financial_transactions.contact_id -> contato relacionado à transação
--   * documents.contact_id              -> contato relacionado ao documento
--   * agenda_events.contact_id          -> contato relacionado ao evento/tarefa
--
-- Cada ALTER é protegido por verificação de existência da tabela, pois alguns
-- ambientes podem ainda não ter aplicado migrations de módulos específicos
-- (ex.: agenda_events). Re-rode esta migration após criar a tabela faltante.

DO $$
BEGIN
  IF to_regclass('public.contracts') IS NOT NULL THEN
    ALTER TABLE public.contracts
      ADD COLUMN IF NOT EXISTS primary_contact_id uuid
        REFERENCES public.contacts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_contracts_primary_contact
      ON public.contracts(primary_contact_id)
      WHERE primary_contact_id IS NOT NULL;
  END IF;

  IF to_regclass('public.financial_transactions') IS NOT NULL THEN
    ALTER TABLE public.financial_transactions
      ADD COLUMN IF NOT EXISTS contact_id uuid
        REFERENCES public.contacts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_financial_transactions_contact
      ON public.financial_transactions(contact_id)
      WHERE contact_id IS NOT NULL;
  END IF;

  IF to_regclass('public.documents') IS NOT NULL THEN
    ALTER TABLE public.documents
      ADD COLUMN IF NOT EXISTS contact_id uuid
        REFERENCES public.contacts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_documents_contact
      ON public.documents(contact_id)
      WHERE contact_id IS NOT NULL;
  END IF;

  IF to_regclass('public.agenda_events') IS NOT NULL THEN
    ALTER TABLE public.agenda_events
      ADD COLUMN IF NOT EXISTS contact_id uuid
        REFERENCES public.contacts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_agenda_events_contact
      ON public.agenda_events(contact_id)
      WHERE contact_id IS NOT NULL;
  END IF;
END $$;
