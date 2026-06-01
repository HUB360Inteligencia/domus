import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  linkContactToProperty,
  unlinkContactFromProperty,
  fetchPropertyContacts,
  fetchContactPropertyLinks,
  linkContactToContract,
  unlinkContactFromContract,
  fetchContractContacts,
  fetchContactContractLinks,
  fetchContactTransactions,
  fetchContactDocuments,
  fetchContactAgendaEvents,
  PropertyLinkInput,
  ContractLinkInput,
} from '@/api/contact-links';
import { ContactLinkEntity } from '@/types/contact';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Vínculos de um imóvel ou contrato (para as fichas de imóvel/contrato). */
export const useEntityContacts = (entity: ContactLinkEntity, entityId?: string) => {
  return useQuery({
    queryKey: ['contact-links', entity, entityId],
    queryFn: () =>
      entity === 'property'
        ? fetchPropertyContacts(entityId || '')
        : fetchContractContacts(entityId || ''),
    enabled: !!entityId,
    staleTime: 1000 * 60 * 5,
  });
};

/** Imóveis e contratos vinculados a um contato (para a ficha do contato). */
export const useContactLinks = (contactId?: string) => {
  const properties = useQuery({
    queryKey: ['contact-links', 'contact', contactId, 'properties'],
    queryFn: () => fetchContactPropertyLinks(contactId || ''),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
  });

  const contracts = useQuery({
    queryKey: ['contact-links', 'contact', contactId, 'contracts'],
    queryFn: () => fetchContactContractLinks(contactId || ''),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
  });

  return { properties, contracts };
};

/** Dados relacionados a um contato: transações, documentos e agenda. */
export const useContactRelatedData = (
  contactId: string | undefined,
  options: { financial?: boolean; documents?: boolean } = {},
) => {
  const transactions = useQuery({
    queryKey: ['contact-financial', contactId],
    queryFn: () => fetchContactTransactions(contactId || ''),
    enabled: !!contactId && options.financial !== false,
    staleTime: 1000 * 60 * 5,
  });

  const documents = useQuery({
    queryKey: ['contact-documents', contactId],
    queryFn: () => fetchContactDocuments(contactId || ''),
    enabled: !!contactId && options.documents !== false,
    staleTime: 1000 * 60 * 5,
  });

  const agenda = useQuery({
    queryKey: ['contact-agenda', contactId],
    queryFn: () => fetchContactAgendaEvents(contactId || ''),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
  });

  return { transactions, documents, agenda };
};

export const useContactLinkMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contact-links'] });
  };

  const linkProperty = useMutation({
    mutationFn: (input: PropertyLinkInput) => linkContactToProperty(input),
    onSuccess: () => {
      invalidate();
      toast.success('Imóvel vinculado ao contato!');
    },
    onError: (e: unknown) => toast.error(`Erro ao vincular imóvel: ${errorMessage(e)}`),
  });

  const linkContract = useMutation({
    mutationFn: (input: ContractLinkInput) => linkContactToContract(input),
    onSuccess: () => {
      invalidate();
      toast.success('Contrato vinculado ao contato!');
    },
    onError: (e: unknown) => toast.error(`Erro ao vincular contrato: ${errorMessage(e)}`),
  });

  const unlinkProperty = useMutation({
    mutationFn: (linkId: string) => unlinkContactFromProperty(linkId),
    onSuccess: () => {
      invalidate();
      toast.success('Vínculo removido.');
    },
    onError: (e: unknown) => toast.error(`Erro ao remover vínculo: ${errorMessage(e)}`),
  });

  const unlinkContract = useMutation({
    mutationFn: (linkId: string) => unlinkContactFromContract(linkId),
    onSuccess: () => {
      invalidate();
      toast.success('Vínculo removido.');
    },
    onError: (e: unknown) => toast.error(`Erro ao remover vínculo: ${errorMessage(e)}`),
  });

  return {
    linkProperty: linkProperty.mutateAsync,
    linkContract: linkContract.mutateAsync,
    unlinkProperty: unlinkProperty.mutateAsync,
    unlinkContract: unlinkContract.mutateAsync,
    isLinking: linkProperty.isPending || linkContract.isPending,
    isUnlinking: unlinkProperty.isPending || unlinkContract.isPending,
  };
};
