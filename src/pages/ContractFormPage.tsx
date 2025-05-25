
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContracts } from '@/hooks/use-contracts';
import { ContractFormData } from '@/types/contract';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ContractForm } from '@/components/contracts/contract-form';

export default function ContractFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { 
    createContract, 
    updateContract, 
    setSelectedContractId, 
    selectedContract, 
    isLoadingSelectedContract,
    isCreatingContract,
    isUpdatingContract,
    uploadContractDocument
  } = useContracts();

  // Use useCallback to stabilize this function reference
  const loadContractData = useCallback((contractId: string) => {
    console.log('Loading contract data for ID:', contractId);
    setSelectedContractId(contractId);
  }, [setSelectedContractId]);

  useEffect(() => {
    if (id) {
      console.log('Edit mode detected for contract ID:', id);
      loadContractData(id);
      setIsEditMode(true);
    } else {
      console.log('Create mode detected');
      setIsEditMode(false);
      // Reset selected contract when in create mode
      setSelectedContractId(null);
    }
  }, [id, loadContractData, setSelectedContractId]);

  // Debug log to track selectedContract changes
  useEffect(() => {
    if (isEditMode) {
      console.log('Selected contract updated:', selectedContract);
    }
  }, [selectedContract, isEditMode]);

  const handleSubmit = async (data: ContractFormData, documentFile?: File) => {
    try {
      if (isEditMode && id) {
        // Update existing contract
        console.log('Updating contract with data:', { id, ...data });
        await updateContract({ id, ...data });
        
        // If there's a new document, upload it
        if (documentFile) {
          console.log('Uploading new document for contract');
          await uploadContractDocument({ contractId: id, file: documentFile });
        }
        
        toast.success('Contrato atualizado com sucesso!');
        navigate('/contracts');
      } else {
        // Create new contract with proper return handling
        console.log('Creating new contract with data:', data);
        const newContract = await createContract(data, {
          onSuccess: (contract) => {
            console.log('Contract created with ID:', contract.id);
            // If there's a document file and the contract was created successfully
            if (documentFile && contract && contract.id) {
              uploadContractDocument({ 
                contractId: contract.id, 
                file: documentFile 
              }).catch(err => {
                console.error('Error uploading document:', err);
                toast.error('Contrato criado, mas houve erro ao anexar documento.');
              });
            }
          }
        });
        
        toast.success('Contrato criado com sucesso!');
        navigate('/contracts');
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Erro ao salvar contrato: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleCancel = () => {
    navigate('/contracts');
  };

  if (isEditMode && isLoadingSelectedContract) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-petroleum mb-4" />
        <p className="text-muted-foreground">Carregando dados do contrato...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {isEditMode ? 'Editar Contrato' : 'Novo Contrato'}
      </h1>
      
      <ContractForm
        key={selectedContract?.id || 'new'} // Add key to force re-render when changing contract
        initialData={isEditMode ? selectedContract : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreatingContract || isUpdatingContract}
      />
    </div>
  );
}
