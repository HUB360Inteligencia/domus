
import { useQuery } from '@tanstack/react-query';
import { fetchContracts, fetchContractById } from '@/api/contracts';
import { fetchContractTemplates } from '@/api/contract-templates';
import { fetchDocuments, fetchContractDocuments } from '@/api/documents';
import { fetchNotifications } from '@/api/notifications';

export const useContractQueries = (selectedContractId: string | null = null) => {
  // Fetch all contracts
  const { 
    data: contracts = [], 
    isLoading: isLoadingContracts,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fetch selected contract details
  const {
    data: selectedContract,
    isLoading: isLoadingSelectedContract,
    refetch: refetchSelectedContract,
  } = useQuery({
    queryKey: ['contract', selectedContractId],
    queryFn: () => fetchContractById(selectedContractId || ''),
    enabled: !!selectedContractId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch contract templates
  const {
    data: contractTemplates = [],
    isLoading: isLoadingTemplates,
  } = useQuery({
    queryKey: ['contractTemplates'],
    queryFn: fetchContractTemplates,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch all documents
  const {
    data: documents = [],
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => fetchDocuments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch documents for the selected contract
  const {
    data: contractDocuments = [],
    isLoading: isLoadingContractDocuments,
    refetch: refetchContractDocuments,
  } = useQuery({
    queryKey: ['contractDocuments', selectedContractId],
    queryFn: () => fetchContractDocuments(selectedContractId || ''),
    enabled: !!selectedContractId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(),
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    contracts,
    isLoadingContracts,
    refetchContracts,
    
    selectedContract,
    isLoadingSelectedContract,
    refetchSelectedContract,
    
    contractTemplates,
    isLoadingTemplates,
    
    documents,
    isLoadingDocuments,
    refetchDocuments,
    
    contractDocuments,
    isLoadingContractDocuments,
    refetchContractDocuments,
    
    notifications,
    isLoadingNotifications,
    refetchNotifications,
    
    isLoading: isLoadingContracts || isLoadingSelectedContract || 
               isLoadingTemplates || isLoadingDocuments || 
               isLoadingContractDocuments || isLoadingNotifications,
  };
};
