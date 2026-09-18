-- =============================================================================
-- Compartilhamento por organização dos dados "filhos" do imóvel e dos arquivos
-- de documentos.
--
-- Problema: properties/contracts/documents já são visíveis para a organização
-- (client_id), mas property_images, property_valuations, property_investments,
-- property_occupancy_periods e o bucket contract_documents só liberam o próprio
-- autor (user_id/owner = auth.uid()). Outro membro da organização abre o imóvel
-- e não vê fotos/avaliações/investimentos, e não consegue baixar documentos.
--
-- Solução: SELECT liberado a quem pode ver o imóvel/documento pai; escrita a quem
-- pode escrever no pai (mesmas regras de user_can_access_row/user_can_write_row).
-- As políticas antigas por user_id continuam valendo (somam por OR).
--
-- Idempotente e defensiva (ver memória: banco remoto é atualizado manualmente).
-- =============================================================================

DO $$
DECLARE
  child text;
BEGIN
  FOREACH child IN ARRAY ARRAY[
    'property_images',
    'property_valuations',
    'property_investments',
    'property_occupancy_periods'
  ]
  LOOP
    IF to_regclass('public.' || child) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', child || '_select_via_property', child);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (
         EXISTS (SELECT 1 FROM public.properties p
                 WHERE p.id = %I.property_id
                   AND public.user_can_access_row(p.user_id, p.client_id)))',
      child || '_select_via_property', child, child);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', child || '_write_via_property', child);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING (EXISTS (SELECT 1 FROM public.properties p
                        WHERE p.id = %I.property_id
                          AND public.user_can_write_row(p.user_id, p.client_id)))
         WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.properties p
                        WHERE p.id = %I.property_id
                          AND public.user_can_write_row(p.user_id, p.client_id)))',
      child || '_write_via_property', child, child, child);
  END LOOP;
END $$;

-- Arquivos de documentos: quem enxerga a linha em public.documents pode baixar o arquivo.
DROP POLICY IF EXISTS "contract_documents_select_via_document_row" ON storage.objects;
CREATE POLICY "contract_documents_select_via_document_row"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contract_documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = storage.objects.name
      AND public.user_can_access_row(d.user_id, d.client_id)
  )
);

-- Comprovantes (transações e investimentos) passaram a usar o bucket expense_receipts
-- em pastas <user_id>/...; permite ao autor remover o próprio arquivo.
DROP POLICY IF EXISTS "expense_receipts_delete_own_folder" ON storage.objects;
CREATE POLICY "expense_receipts_delete_own_folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'expense_receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
