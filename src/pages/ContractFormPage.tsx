
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContracts } from '@/hooks/use-contracts';
import { ContractFormData } from '@/types/contract';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ContractForm } from '@/components/contracts/contract-form';

export default function ContractFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  const [contractId, setContractId] = useState<string | null>(null);
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
  const loadContractData = useCallback((id: string) => {
    console.log('Loading contract data for ID:', id);
    setSelectedContractId(id);
  }, [setSelectedContractId]);

  useEffect(() => {
    // Check if we're in edit mode by looking for an ID in the URL params or query params
    // First check route params (/:id/edit)
    const id = params.id;
    
    // If not in params, check query string (?id=...)
    const queryParams = new URLSearchParams(location.search);
    const queryId = queryParams.get('id');
    
    const contractIdToUse = id || queryId;
    
    if (contractIdToUse) {
      console.log('Edit mode detected for contract ID:', contractIdToUse);
      setContractId(contractIdToUse);
      loadContractData(contractIdToUse);
      setIsEditMode(true);
    } else {
      console.log('Create mode detected');
      setIsEditMode(false);
      setContractId(null);
      // Reset selected contract when in create mode
      setSelectedContractId(null);
    }
  }, [location.search, loadContractData, params.id, setSelectedContractId]);

  // Debug log to track selectedContract changes
  useEffect(() => {
    if (isEditMode) {
      console.log('Selected contract updated:', selectedContract);
    }
  }, [selectedContract, isEditMode]);

  const handleSubmit = async (data: ContractFormData, documentFile?: File) => {
    try {
      if (isEditMode && contractId) {
        // Update existing contract
        console.log('Updating contract with data:', { id: contractId, ...data });
        await updateContract({ id: contractId, ...data });
        
        // If there's a new document, upload it
        if (documentFile) {
          console.log('Uploading new document for contract');
          await uploadContractDocument({ contractId, file: documentFile });
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
