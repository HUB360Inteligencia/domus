
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Contract, ContractFormData } from '@/types/contract';
import { useContractQueries } from './use-contract-queries';
import { useContractMutations } from './use-contract-mutations';
import { useCurrentUserClientId } from './use-client-users';

export const useContracts = () => {
  const { user } = useAuth();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const { data: clientId } = useCurrentUserClientId();

  // Use useCallback to stabilize function references
  const setSelectedContractIdCallback = useCallback((id: string | null) => {
    setSelectedContractId(id);
  }, []);

  const { 
    contracts, 
    selectedContract, 
    contractTemplates,
    documents,
    contractDocuments,
    notifications,
    isLoading,
    isLoadingContracts,
    isLoadingSelectedContract,
    isLoadingTemplates,
    isLoadingDocuments,
    isLoadingContractDocuments,
    isLoadingNotifications,
    refetchContracts,
    refetchSelectedContract,
    refetchDocuments,
    refetchContractDocuments,
    refetchNotifications
  } = useContractQueries(selectedContractId, clientId);
  
  const {
    createContract,
    updateContract,
    deleteContract,
    uploadContractDocument,
    updateContractStatus,
    updateSignatureStatus,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createClause,
    updateClause,
    deleteClause,
    uploadDocument,
    deleteDocument,
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    isCreatingContract,
    isUpdatingContract,
    isDeletingContract,
    isUploadingContractDocument,
    isUpdatingContractStatus,
    isUpdatingSignatureStatus,
    isCreatingTemplate,
    isUpdatingTemplate,
    isDeletingTemplate,
    isCreatingClause,
    isUpdatingClause,
    isDeletingClause,
    isUploadingDocument,
    isDeletingDocument,
    isCreatingNotification,
    isMarkingNotification,
    isMarkingAllNotifications,
    isDeletingNotification
  } = useContractMutations();

  return {
    // Data
    user,
    contracts,
    selectedContract,
    contractTemplates,
    documents,
    contractDocuments,
    notifications,
    clientId,
    
    // Actions
    setSelectedContractId: setSelectedContractIdCallback,
    createContract,
    updateContract,
    deleteContract,
    uploadContractDocument,
    updateContractStatus,
    updateSignatureStatus,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createClause,
    updateClause,
    deleteClause,
    uploadDocument,
    deleteDocument,
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    
    // Refetch functions
    refetchContracts,
    refetchSelectedContract,
    refetchDocuments,
    refetchContractDocuments,
    refetchNotifications,
    
    // Loading states
    isLoading,
    isLoadingContracts,
    isLoadingSelectedContract,
    isLoadingTemplates,
    isLoadingDocuments,
    isLoadingContractDocuments,
    isLoadingNotifications,
    isCreatingContract,
    isUpdatingContract,
    isDeletingContract,
    isUploadingContractDocument,
    isUpdatingContractStatus,
    isUpdatingSignatureStatus,
    isCreatingTemplate,
    isUpdatingTemplate,
    isDeletingTemplate,
    isCreatingClause,
    isUpdatingClause,
    isDeletingClause,
    isUploadingDocument,
    isDeletingDocument,
    isCreatingNotification,
    isMarkingNotification,
    isMarkingAllNotifications,
    isDeletingNotification,
    
    // Utility
    hasContracts: contracts.length > 0,
    unreadNotificationsCount: notifications.filter(n => !n.is_read).length
  };
};
