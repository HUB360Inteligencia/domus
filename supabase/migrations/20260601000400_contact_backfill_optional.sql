-- Módulo Contatos — backfill OPCIONAL e MANUAL.
-- Converte os campos de texto legados de um contrato (tenant_*/agency_*) em
-- contatos + vínculos (contact_contract_links), de forma IDEMPOTENTE.
--
-- IMPORTANTE: esta função NÃO é executada automaticamente. Rode manualmente,
-- por registro, quando desejar migrar os dados. Os campos de texto legados são
-- preservados (continuam sendo a fonte de verdade durante a transição).
--
-- Uso:
--   SELECT public.convert_contract_parties_to_contacts('<contract_id>');
--   -- ou em lote, por organização:
--   SELECT public.convert_contract_parties_to_contacts(id)
--   FROM public.contracts WHERE client_id = '<client_id>';

CREATE OR REPLACE FUNCTION public.convert_contract_parties_to_contacts(p_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_contract public.contracts%ROWTYPE;
  v_contact_id uuid;
  v_doc text;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id;
  IF NOT FOUND THEN
    RAISE NOTICE 'Contrato % não encontrado', p_contract_id;
    RETURN;
  END IF;

  -- ----- Inquilino (tenant_*) -----
  IF coalesce(btrim(v_contract.tenant_name), '') <> '' THEN
    v_doc := regexp_replace(coalesce(v_contract.tenant_document, ''), '\D', '', 'g');

    -- Tenta reusar contato existente pelo documento normalizado
    SELECT id INTO v_contact_id
    FROM public.contacts
    WHERE user_id = v_contract.user_id
      AND deleted_at IS NULL
      AND v_doc <> ''
      AND document_number = v_doc
    LIMIT 1;

    IF v_contact_id IS NULL THEN
      INSERT INTO public.contacts (
        user_id, client_id, kind, display_name, document_number,
        document_type, primary_phone, status
      ) VALUES (
        v_contract.user_id, v_contract.client_id, 'pf', v_contract.tenant_name,
        NULLIF(v_doc, ''), CASE WHEN length(v_doc) = 14 THEN 'cnpj' ELSE 'cpf' END,
        NULLIF(regexp_replace(coalesce(v_contract.tenant_contact, ''), '\D', '', 'g'), ''),
        'active'
      )
      RETURNING id INTO v_contact_id;

      INSERT INTO public.contact_roles (contact_id, user_id, client_id, role_type)
      VALUES (v_contact_id, v_contract.user_id, v_contract.client_id, 'tenant')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Vínculo contato<->contrato (idempotente via unique parcial)
    INSERT INTO public.contact_contract_links (
      contact_id, contract_id, user_id, client_id, link_role
    ) VALUES (
      v_contact_id, p_contract_id, v_contract.user_id, v_contract.client_id, 'tenant'
    ) ON CONFLICT DO NOTHING;

    -- Atalho de contato principal
    UPDATE public.contracts
    SET primary_contact_id = coalesce(primary_contact_id, v_contact_id)
    WHERE id = p_contract_id;
  END IF;

  -- ----- Imobiliária (agency_*) -----
  IF coalesce(btrim(v_contract.agency_name), '') <> '' THEN
    SELECT id INTO v_contact_id
    FROM public.contacts
    WHERE user_id = v_contract.user_id
      AND deleted_at IS NULL
      AND kind = 'pj'
      AND display_name = v_contract.agency_name
    LIMIT 1;

    IF v_contact_id IS NULL THEN
      INSERT INTO public.contacts (
        user_id, client_id, kind, display_name, primary_phone, status
      ) VALUES (
        v_contract.user_id, v_contract.client_id, 'pj', v_contract.agency_name,
        NULLIF(regexp_replace(coalesce(v_contract.agency_contact, ''), '\D', '', 'g'), ''),
        'active'
      )
      RETURNING id INTO v_contact_id;

      INSERT INTO public.contact_roles (contact_id, user_id, client_id, role_type)
      VALUES (v_contact_id, v_contract.user_id, v_contract.client_id, 'real_estate_agency')
      ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO public.contact_contract_links (
      contact_id, contract_id, user_id, client_id, link_role
    ) VALUES (
      v_contact_id, p_contract_id, v_contract.user_id, v_contract.client_id, 'real_estate_agency'
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
