import { useQuery } from '@tanstack/react-query';
import {
  fetchContacts,
  fetchContactById,
  fetchContactsSummary,
} from '@/api/contacts';
import { ContactFilters } from '@/types/contact';

export const useContactQueries = (
  filters: ContactFilters = {},
  selectedContactId: string | null = null,
) => {
  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => fetchContacts(filters),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['contacts', 'summary'],
    queryFn: fetchContactsSummary,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: selectedContact,
    isLoading: isLoadingSelectedContact,
    refetch: refetchSelectedContact,
  } = useQuery({
    queryKey: ['contact', selectedContactId],
    queryFn: () => fetchContactById(selectedContactId || ''),
    enabled: !!selectedContactId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    contacts,
    isLoadingContacts,
    refetchContacts,

    summary,
    isLoadingSummary,
    refetchSummary,

    selectedContact,
    isLoadingSelectedContact,
    refetchSelectedContact,

    isLoading: isLoadingContacts || isLoadingSelectedContact,
  };
};
