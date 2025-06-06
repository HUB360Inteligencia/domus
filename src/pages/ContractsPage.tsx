
import { useState } from 'react';
import { useContracts } from '@/hooks/use-contracts';
import { ContractList } from '@/components/contract-list';
import { ContractFilters } from '@/components/contracts/contract-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ContractsPage() {
  const { contracts, isLoading, deleteContract } = useContracts();
  const [filterOptions, setFilterOptions] = useState({
    searchTerm: "",
    status: [],
    city: "",
    neighborhood: "",
    propertyType: "",
    minValue: null,
    maxValue: null,
    dateRange: undefined,
    tags: [],
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

  // Apply filters to contracts
  const filteredContracts = contracts.filter(contract => {
    // Search term filter
    if (filterOptions.searchTerm) {
      const searchLower = filterOptions.searchTerm.toLowerCase();
      const matchesSearch = 
        contract.title.toLowerCase().includes(searchLower) ||
        contract.tenant_name.toLowerCase().includes(searchLower) ||
        (contract.property?.title && contract.property.title.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterOptions.status.length > 0 && !filterOptions.status.includes(contract.status)) {
      return false;
    }

    // City filter
    if (filterOptions.city && contract.property?.city !== filterOptions.city) {
      return false;
    }

    // Neighborhood filter
    if (filterOptions.neighborhood && contract.property?.neighborhood !== filterOptions.neighborhood) {
      return false;
    }

    // Property type filter
    if (filterOptions.propertyType && contract.property?.type !== filterOptions.propertyType) {
      return false;
    }

    // Value range filter
    if (filterOptions.minValue !== null && contract.value < filterOptions.minValue) {
      return false;
    }
    if (filterOptions.maxValue !== null && contract.value > filterOptions.maxValue) {
      return false;
    }

    // Date range filter
    if (filterOptions.dateRange?.from) {
      const contractStart = new Date(contract.start_date);
      const contractEnd = new Date(contract.end_date);
      const filterStart = filterOptions.dateRange.from;
      const filterEnd = filterOptions.dateRange.to || filterStart;
      
      // Check if contract period overlaps with filter range
      if (contractEnd < filterStart || contractStart > filterEnd) {
        return false;
      }
    }

    // Tags filter
    if (filterOptions.tags.length > 0 && contract.property?.tags) {
      const hasMatchingTag = filterOptions.tags.some(tag => 
        contract.property?.tags?.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

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

      <ContractFilters 
        onFilterChange={setFilterOptions}
        contracts={contracts}
      />
      
      <ContractList 
        contracts={filteredContracts}
        isLoading={isLoading}
        onDelete={handleDeleteContract}
      />
    </div>
  );
}
