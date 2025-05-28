
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';
import { useContractMutations } from '@/hooks/use-contract-mutations';

interface ContractStatusSelectProps {
  contract: Contract;
  isDisabled?: boolean;
}

const statusLabels = {
  pending: 'Pendente',
  active: 'Ativo',
  expired: 'Expirado',
  canceled: 'Cancelado',
  draft: 'Rascunho'
};

const statusColors = {
  pending: 'secondary',
  active: 'default',
  expired: 'destructive',
  canceled: 'outline',
  draft: 'secondary'
} as const;

export const ContractStatusSelect: React.FC<ContractStatusSelectProps> = ({ 
  contract, 
  isDisabled = false 
}) => {
  const { updateContractStatus, isUpdatingContractStatus } = useContractMutations();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateContractStatus({ 
        id: contract.id, 
        status: newStatus as any 
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Status:</span>
      <Select
        value={contract.status}
        onValueChange={handleStatusChange}
        disabled={isDisabled || isUpdatingContractStatus}
      >
        <SelectTrigger className="w-32">
          <SelectValue>
            <Badge variant={statusColors[contract.status as keyof typeof statusColors]}>
              {statusLabels[contract.status as keyof typeof statusLabels]}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(statusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              <Badge variant={statusColors[value as keyof typeof statusColors]}>
                {label}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
