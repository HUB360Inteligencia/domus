
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText } from 'lucide-react';
import { useContracts } from '@/hooks/use-contracts';
import { ContractList } from '@/components/contract-list';
import { ContractFilters, FilterOptions } from '@/components/contracts/contract-filters';
import { toast } from 'sonner';

const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    contracts, 
    deleteContract, 
    isLoadingContracts, 
    isDeletingContract,
    refetchContracts 
  } = useContracts();
  
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    status: [],
    city: '',
    neighborhood: '',
    propertyType: '',
    minValue: null,
    maxValue: null,
    dateRange: undefined,
    tags: [],
  });

  // Apply filters to contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          contract.title.toLowerCase().includes(searchLower) ||
          contract.tenant_name.toLowerCase().includes(searchLower) ||
          contract.property?.title?.toLowerCase().includes(searchLower) ||
          contract.property?.address?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(contract.status)) {
        return false;
      }

      // City filter
      if (filters.city && contract.property?.city !== filters.city) {
        return false;
      }

      // Neighborhood filter
      if (filters.neighborhood && contract.property?.neighborhood !== filters.neighborhood) {
        return false;
      }

      // Property type filter
      if (filters.propertyType && contract.property?.type !== filters.propertyType) {
        return false;
      }

      // Value range filter
      if (filters.minValue !== null && contract.value < filters.minValue) {
        return false;
      }
      if (filters.maxValue !== null && contract.value > filters.maxValue) {
        return false;
      }

      // Date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const contractStart = new Date(contract.start_date);
        const contractEnd = new Date(contract.end_date);
        
        if (filters.dateRange.from && contractEnd < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && contractStart > filters.dateRange.to) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const contractTags = contract.property?.tags || [];
        const hasMatchingTag = filters.tags.some(tag => contractTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [contracts, filters]);

  const handleView = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract?.property_id) {
      navigate(`/properties/${contract.property_id}?tab=contracts&contractId=${contractId}`);
    } else {
      navigate(`/contracts/${contractId}`);
    }
  };

  const handleEdit = (contractId: string) => {
    navigate(`/contracts/edit/${contractId}`);
  };

  const handleDelete = async (contractId: string) => {
    try {
      await deleteContract(contractId);
      toast.success('Contrato excluído com sucesso!');
      await refetchContracts();
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast.error(`Erro ao excluir contrato: ${error.message}`);
    }
  };

  if (isLoadingContracts) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Contratos</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Button onClick={() => navigate('/contracts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <ContractFilters 
        onFilterChange={setFilters} 
        contracts={contracts}
      />

      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {contracts.length === 0 ? 'Nenhum contrato cadastrado' : 'Nenhum contrato encontrado'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {contracts.length === 0
                ? 'Comece criando seu primeiro contrato.'
                : 'Tente ajustar os filtros para encontrar contratos.'
              }
            </p>
            {contracts.length === 0 && (
              <Button onClick={() => navigate('/contracts/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Contrato
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ContractList
          contracts={filteredContracts}
          isLoading={isDeletingContract}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default ContractsPage;
