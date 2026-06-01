import { useState } from 'react';
import { useContactQueries } from '@/hooks/use-contact-queries';
import { useContactMutations } from '@/hooks/use-contact-mutations';
import { ContactFilters } from '@/types/contact';

/**
 * Orquestrador do módulo de Contatos (espelha o padrão de use-contracts.ts):
 * combina queries + mutations e mantém o estado de filtros/seleção.
 */
export const useContacts = (initialSelectedId: string | null = null) => {
  const [filters, setFilters] = useState<ContactFilters>({});
  const [selectedContactId, setSelectedContactId] = useState<string | null>(initialSelectedId);

  const queries = useContactQueries(filters, selectedContactId);
  const mutations = useContactMutations();

  return {
    ...queries,
    ...mutations,
    filters,
    setFilters,
    selectedContactId,
    setSelectedContactId,
    isLoading: queries.isLoading || mutations.isLoading,
  };
};
