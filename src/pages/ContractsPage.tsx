
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Calendar, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { ContractList } from "@/components/contract-list";
import { useContracts } from "@/hooks/use-contracts";
import { ContractFilters, FilterOptions } from "@/components/contracts/contract-filters";

export default function ContractsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { contracts, isLoadingContracts } = useContracts();
  
  const [filters, setFilters] = useState<FilterOptions>({
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

  // Filter contracts based on all filters
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Search term filter
      const matchesSearch = filters.searchTerm ? 
        contract.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (contract.terms && contract.terms.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        contract.tenant_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (contract.property?.title && contract.property.title.toLowerCase().includes(filters.searchTerm.toLowerCase()))
        : true;
      
      // Status filter
      const matchesStatus = filters.status.length > 0 ? 
        filters.status.includes(contract.status) : true;
      
      // City filter
      const matchesCity = filters.city ? 
        contract.property?.city === filters.city : true;
      
      // Neighborhood filter  
      const matchesNeighborhood = filters.neighborhood ? 
        contract.property?.neighborhood === filters.neighborhood : true;
      
      // Property type filter
      const matchesPropertyType = filters.propertyType ? 
        contract.property?.type === filters.propertyType : true;
      
      // Value range filter
      const matchesValue = 
        (!filters.minValue || contract.value >= filters.minValue) &&
        (!filters.maxValue || contract.value <= filters.maxValue);
      
      // Date range filter
      const startDate = contract.start_date ? new Date(contract.start_date) : null;
      const endDate = contract.end_date ? new Date(contract.end_date) : null;
      
      const matchesDateRange = !filters.dateRange || !filters.dateRange.from ? true :
        (startDate && filters.dateRange.from && startDate >= filters.dateRange.from &&
        (!filters.dateRange.to || (endDate && endDate <= filters.dateRange.to)));
      
      // Tags filter
      const matchesTags = filters.tags.length === 0 ? true :
        filters.tags.some(tag => contract.property?.tags?.includes(tag));
      
      // Combined filters
      return matchesSearch && matchesStatus && matchesCity && 
             matchesNeighborhood && matchesPropertyType && 
             matchesValue && matchesDateRange && matchesTags;
    });
  }, [contracts, filters]);

  // Filter based on tab selection 
  const tabFilteredContracts = useMemo(() => {
    if (activeTab === "all") return filteredContracts;
    return filteredContracts.filter(contract => contract.status === activeTab);
  }, [filteredContracts, activeTab]);
  
  // Get contracts count per status for tabs
  const activeContracts = contracts.filter(contract => contract.status === "active");
  const pendingContracts = contracts.filter(contract => contract.status === "pending");
  const expiredContracts = contracts.filter(contract => contract.status === "expired");
  const draftContracts = contracts.filter(contract => contract.status === "draft");

  // Handle navigation
  const handleViewContract = (id: string) => {
    navigate(`/contracts/${id}`);
  };

  const handleEditContract = (id: string) => {
    navigate(`/contracts/${id}/edit`);
  };

  const handleDownloadContract = (id: string) => {
    // Find the contract document URL
    const contract = contracts.find(c => c.id === id);
    if (contract?.document_url) {
      window.open(contract.document_url, '_blank');
    }
  };

  const handleDeleteContract = (id: string) => {
    // To be implemented
    console.log("Delete contract:", id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Gerencie todos os seus contratos em um só lugar."
        className="pb-4"
      >
        <div className="flex gap-2">
          <Button onClick={() => navigate("/contracts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
          <div className="border rounded-md flex">
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PageHeader>
      
      <div className="space-y-4">
        <ContractFilters
          onFilterChange={setFilters}
          contracts={contracts}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                Todos ({contracts.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Ativos ({activeContracts.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes ({pendingContracts.length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expirados ({expiredContracts.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Rascunhos ({draftContracts.length})
              </TabsTrigger>
            </TabsList>
            
            {isLoadingContracts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TabsContent value={activeTab} className="mt-0">
                <ContractList 
                  contracts={tabFilteredContracts}
                  onView={handleViewContract}
                  onEdit={handleEditContract} 
                  onDownload={handleDownloadContract}
                  onDelete={handleDeleteContract}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
