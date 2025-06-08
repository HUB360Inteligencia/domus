
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractFormEnhanced } from '@/components/contracts/contract-form-enhanced';
import { useContracts } from '@/hooks/use-contracts';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { 
    setSelectedContractId, 
    selectedContract, 
    isLoadingSelectedContract 
  } = useContracts();

  // Load contract data for editing
  useEffect(() => {
    if (id) {
      console.log('Edit mode detected for contract ID:', id);
      setSelectedContractId(id);
      setIsEditMode(true);
    } else {
      console.log('Create mode detected');
      setIsEditMode(false);
      setSelectedContractId(null);
    }
  }, [id, setSelectedContractId]);

  const handleSuccess = useCallback((contractId: string) => {
    console.log('Contract saved successfully:', contractId);
    toast.success(isEditMode ? 'Contrato atualizado com sucesso!' : 'Contrato criado com sucesso!');
    navigate('/contracts');
  }, [isEditMode, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/contracts');
  }, [navigate]);

  // Show loading state only when necessary
  if (isEditMode && isLoadingSelectedContract && !selectedContract) {
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
      
      <ContractFormEnhanced
        key={selectedContract?.id || 'new'}
        initialData={isEditMode ? selectedContract : null}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
