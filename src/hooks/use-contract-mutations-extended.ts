import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Contract } from '@/types/contract';
import { 
  createContract, 
  updateContract, 
  deleteContract, 
  uploadContractDocument, 
  updateContractStatus,
  updateSignatureStatus
} from '@/api/contracts';
import { createOccupancyFromContract } from '@/api/property-occupancy';

export const useContractMutationsExtended = () => {
  const queryClient = useQueryClient();
  
  const createContractMutation = useMutation({
    mutationFn: createContract,
    onSuccess: (newContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato criado com sucesso!');
      
      // If status is active, create an occupancy record
      if (newContract.status === 'active' && newContract.property_id) {
        createOccupancyFromContract(newContract);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar contrato: ${error.message}`);
    }
  });

  const updateContractMutation = useMutation({
    mutationFn: updateContract,
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', updatedContract.id] });
      toast.success('Contrato atualizado com sucesso!');
      
      // If status is active, update occupancy record
      if (updatedContract.status === 'active' && updatedContract.property_id) {
        createOccupancyFromContract(updatedContract);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar contrato: ${error.message}`);
    }
  });
  
  const updateContractStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Contract['status'] }) => 
      updateContractStatus(id, status),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', updatedContract.id] });
      toast.success('Status do contrato atualizado com sucesso!');
      
      // Update occupancy record when status changes
      if (updatedContract.property_id) {
        createOccupancyFromContract(updatedContract);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status do contrato: ${error.message}`);
    }
  });

  // Other mutations remain the same
  const deleteContractMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir contrato: ${error.message}`);
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadContractDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', variables.contractId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar documento: ${error.message}`);
    }
  });

  const updateSignatureMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Contract['signature_status'] }) => 
      updateSignatureStatus(id, status),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', updatedContract.id] });
      toast.success('Status da assinatura atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status da assinatura: ${error.message}`);
    }
  });

  return {
    createContract: createContractMutation.mutateAsync,
    updateContract: updateContractMutation.mutate,
    updateContractStatus: updateContractStatusMutation.mutate,
    deleteContract: deleteContractMutation.mutate,
    uploadDocument: uploadDocumentMutation.mutateAsync,
    updateSignature: updateSignatureMutation.mutate,
    isCreating: createContractMutation.isPending,
    isUpdating: updateContractMutation.isPending || updateContractStatusMutation.isPending,
    isDeleting: deleteContractMutation.isPending,
    isUploading: uploadDocumentMutation.isPending,
  };
};
