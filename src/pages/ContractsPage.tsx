
import { useState } from 'react';
import { useContracts } from '@/hooks/use-contracts';
import { ContractList } from '@/components/contracts/contract-list';
import { ContractFilters } from '@/components/contracts/contract-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ContractsPage() {
  const { contracts, isLoading, deleteContract, isDeleting } = useContracts();
  const [filters, setFilters] = useState({
    status: '',
    property: '',
    tenant: ''
  });

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    try {
      await deleteContract(id);
      toast.success('Contrato excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      toast.error('Erro ao excluir contrato');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (filters.status && contract.status !== filters.status) return false;
    if (filters.tenant && !contract.tenant_name.toLowerCase().includes(filters.tenant.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie seus contratos de locação
          </p>
        </div>
        <Link to="/contracts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        </Link>
      </div>

      <ContractFilters filters={filters} onFiltersChange={setFilters} />
      
      <ContractList 
        contracts={filteredContracts}
        isLoading={isLoading}
        onDelete={handleDeleteContract}
        isDeleting={isDeleting}
      />
    </div>
  );
}
