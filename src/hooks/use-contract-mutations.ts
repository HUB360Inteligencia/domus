
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  createContract, 
  updateContract, 
  deleteContract, 
  uploadContractDocument,
  updateContractStatus,
  updateSignatureStatus
} from '@/api/contracts';
import {
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  createClause,
  updateClause,
  deleteClause
} from '@/api/contract-templates';
import {
  uploadDocument,
  deleteDocument
} from '@/api/documents';
import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/api/notifications';
import { Contract, ContractFormData } from '@/types/contract';

export const useContractMutations = () => {
  const queryClient = useQueryClient();

  // Contract mutations
  const { mutateAsync: createContractMutation, isPending: isCreatingContract } = useMutation({
    mutationFn: createContract,
    onSuccess: async (newContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', 'property', newContract.property_id] });
      
      // Se o contrato foi criado como pendente, criar uma atividade
      if (newContract.status === 'pending' && newContract.property_id) {
        try {
          const { createActivity } = await import('@/api/activities');
          await createActivity({
            title: `Finalizar contrato: ${newContract.title}`,
            description: `Contrato com ${newContract.tenant_name} precisa ser finalizado e assinado`,
            activity_type: 'legal',
            priority: 'high',
            status: 'pending',
            property_id: newContract.property_id,
            contract_id: newContract.id,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
            user_id: newContract.user_id
          });
          
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          queryClient.invalidateQueries({ queryKey: ['activities', 'property', newContract.property_id] });
        } catch (error) {
          console.error('Error creating activity for pending contract:', error);
        }
      }
      
      toast.success('Contrato criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar contrato: ${error.message}`);
    }
  });

  const { mutateAsync: updateContractMutation, isPending: isUpdatingContract } = useMutation({
    mutationFn: updateContract,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
      toast.success('Contrato atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar contrato: ${error.message}`);
    }
  });

  const { mutateAsync: deleteContractMutation, isPending: isDeletingContract } = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir contrato: ${error.message}`);
    }
  });

  const { mutateAsync: uploadContractDocumentMutation, isPending: isUploadingContractDocument } = useMutation({
    mutationFn: uploadContractDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract', variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contractDocuments', variables.contractId] });
      toast.success('Documento anexado ao contrato com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao anexar documento: ${error.message}`);
    }
  });

  const { mutateAsync: updateContractStatusMutation, isPending: isUpdatingContractStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateContractStatus(id, status),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
      queryClient.invalidateQueries({ queryKey: ['contracts', 'property', data.property_id] });
      
      // Se o contrato mudou para ativo, completar atividade relacionada
      if (data.status === 'active' && data.id) {
        try {
          const { data: activities } = await supabase
            .from('activities')
            .select('id')
            .eq('contract_id', data.id)
            .eq('status', 'pending');
            
          if (activities && activities.length > 0) {
            const { updateActivityStatus } = await import('@/api/activities');
            await updateActivityStatus(activities[0].id, 'completed');
            queryClient.invalidateQueries({ queryKey: ['activities'] });
          }
        } catch (error) {
          console.error('Error completing related activity:', error);
        }
      }
      
      toast.success(`Status do contrato alterado para: ${data.status}`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });

  const { mutateAsync: updateSignatureStatusMutation, isPending: isUpdatingSignatureStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateSignatureStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
      toast.success(`Status da assinatura alterado para: ${data.signature_status}`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status de assinatura: ${error.message}`);
    }
  });

  // Template mutations
  const { mutateAsync: createTemplateMutation, isPending: isCreatingTemplate } = useMutation({
    mutationFn: createContractTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplates'] });
      toast.success('Modelo de contrato criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar modelo: ${error.message}`);
    }
  });

  const { mutateAsync: updateTemplateMutation, isPending: isUpdatingTemplate } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateContractTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplates'] });
      toast.success('Modelo de contrato atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar modelo: ${error.message}`);
    }
  });

  const { mutateAsync: deleteTemplateMutation, isPending: isDeletingTemplate } = useMutation({
    mutationFn: deleteContractTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplates'] });
      toast.success('Modelo de contrato excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir modelo: ${error.message}`);
    }
  });

  // Clause mutations
  const { mutateAsync: createClauseMutation, isPending: isCreatingClause } = useMutation({
    mutationFn: createClause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] });
      toast.success('Cláusula criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar cláusula: ${error.message}`);
    }
  });

  const { mutateAsync: updateClauseMutation, isPending: isUpdatingClause } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateClause(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] });
      toast.success('Cláusula atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar cláusula: ${error.message}`);
    }
  });

  const { mutateAsync: deleteClauseMutation, isPending: isDeletingClause } = useMutation({
    mutationFn: deleteClause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] });
      toast.success('Cláusula excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir cláusula: ${error.message}`);
    }
  });

  // Document mutations
  const { mutateAsync: uploadDocumentMutation, isPending: isUploadingDocument } = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (data.contract_id) {
        queryClient.invalidateQueries({ queryKey: ['contractDocuments', data.contract_id] });
      }
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar documento: ${error.message}`);
    }
  });

  const { mutateAsync: deleteDocumentMutation, isPending: isDeletingDocument } = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (variables.contract_id) {
        queryClient.invalidateQueries({ queryKey: ['contractDocuments', variables.contract_id] });
      }
      toast.success('Documento excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir documento: ${error.message}`);
    }
  });

  // Notification mutations
  const { mutateAsync: createNotificationMutation, isPending: isCreatingNotification } = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Error creating notification:', error);
    }
  });

  const { mutateAsync: markNotificationAsReadMutation, isPending: isMarkingNotification } = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Error marking notification as read:', error);
    }
  });

  const { mutateAsync: markAllNotificationsAsReadMutation, isPending: isMarkingAllNotifications } = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
    onError: (error: any) => {
      toast.error(`Erro ao marcar notificações: ${error.message}`);
    }
  });

  const { mutateAsync: deleteNotificationMutation, isPending: isDeletingNotification } = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Error deleting notification:', error);
    }
  });

  // Wrapper functions with better typing
  const createContractWithCallback = async (data: ContractFormData, callbacks?: { onSuccess?: (contract: Contract) => void }) => {
    const contract = await createContractMutation(data);
    callbacks?.onSuccess?.(contract);
    return contract;
  };

  return {
    // Contract operations
    createContract: createContractWithCallback,
    updateContract: updateContractMutation,
    deleteContract: deleteContractMutation,
    uploadContractDocument: uploadContractDocumentMutation,
    updateContractStatus: updateContractStatusMutation,
    updateSignatureStatus: updateSignatureStatusMutation,
    
    // Template operations
    createTemplate: createTemplateMutation,
    updateTemplate: updateTemplateMutation,
    deleteTemplate: deleteTemplateMutation,
    
    // Clause operations
    createClause: createClauseMutation,
    updateClause: updateClauseMutation,
    deleteClause: deleteClauseMutation,
    
    // Document operations
    uploadDocument: uploadDocumentMutation,
    deleteDocument: deleteDocumentMutation,
    
    // Notification operations
    createNotification: createNotificationMutation,
    markNotificationAsRead: markNotificationAsReadMutation,
    markAllNotificationsAsRead: markAllNotificationsAsReadMutation,
    deleteNotification: deleteNotificationMutation,
    
    // Loading states
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
    
    // Combined loading states
    isLoading: 
      isCreatingContract || isUpdatingContract || isDeletingContract ||
      isUploadingContractDocument || isUpdatingContractStatus || isUpdatingSignatureStatus ||
      isCreatingTemplate || isUpdatingTemplate || isDeletingTemplate ||
      isCreatingClause || isUpdatingClause || isDeletingClause ||
      isUploadingDocument || isDeletingDocument ||
      isCreatingNotification || isMarkingNotification || 
      isMarkingAllNotifications || isDeletingNotification
  };
};
