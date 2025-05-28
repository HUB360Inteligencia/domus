
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ContractStatus } from '@/types/contract';
import { useContractMutations } from '@/hooks/use-contract-mutations';
import { toast } from 'sonner';

interface ContractStatusSelectProps {
  contractId: string;
  currentStatus: ContractStatus;
  onStatusChange?: (newStatus: ContractStatus) => void;
}

export const ContractStatusSelect: React.FC<ContractStatusSelectProps> = ({
  contractId,
  currentStatus,
  onStatusChange
}) => {
  const { updateContractStatus, isUpdatingContractStatus } = useContractMutations();

  const statusOptions = [
    { value: 'draft', label: 'Rascunho', color: 'secondary' },
    { value: 'pending', label: 'Pendente', color: 'outline' },
    { value: 'active', label: 'Ativo', color: 'default' },
    { value: 'expired', label: 'Expirado', color: 'destructive' },
    { value: 'canceled', label: 'Cancelado', color: 'destructive' }
  ] as const;

  const handleStatusChange = async (newStatus: ContractStatus) => {
    try {
      await updateContractStatus({ id: contractId, status: newStatus });
      onStatusChange?.(newStatus);
      
      // Se o contrato mudou para pendente, criar atividade
      if (newStatus === 'pending') {
        // Esta lógica será implementada no hook de contratos
        console.log('Contract set to pending, activity should be created');
      }
    } catch (error) {
      console.error('Error updating contract status:', error);
      toast.error('Erro ao atualizar status do contrato');
    }
  };

  const getCurrentStatusOption = () => {
    return statusOptions.find(option => option.value === currentStatus);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Status:</span>
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdatingContractStatus}
      >
        <SelectTrigger className="w-32">
          <SelectValue>
            <Badge variant={getCurrentStatusOption()?.color as any}>
              {getCurrentStatusOption()?.label}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <Badge variant={option.color as any}>
                {option.label}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
