
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { ContractList } from "@/components/contract-list";
import { useContracts } from "@/hooks/use-contracts";

export default function ContractsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { contracts, isLoadingContracts } = useContracts();

  // Filter contracts based on search term and active tab
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.terms && contract.terms.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && contract.status === "active";
    if (activeTab === "pending") return matchesSearch && contract.status === "pending";
    if (activeTab === "expired") return matchesSearch && contract.status === "expired";
    if (activeTab === "draft") return matchesSearch && contract.status === "draft";
    
    return matchesSearch;
  });

  // Get contracts per status for each tab
  const activeContracts = contracts.filter(contract => contract.status === "active");
  const pendingContracts = contracts.filter(contract => contract.status === "pending");
  const expiredContracts = contracts.filter(contract => contract.status === "expired");
  const draftContracts = contracts.filter(contract => contract.status === "draft");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Gerencie todos os seus contratos em um só lugar."
        className="pb-4"
      >
        <Button onClick={() => navigate("/contracts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </PageHeader>
      
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar contratos..."
          className="pl-8 w-full bg-background"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
              <TabsContent value="all" className="mt-0">
                <ContractList 
                  contracts={filteredContracts} 
                />
              </TabsContent>
            )}
            
            <TabsContent value="active" className="mt-0">
              <ContractList 
                contracts={activeContracts} 
              />
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0">
              <ContractList 
                contracts={pendingContracts} 
              />
            </TabsContent>
            
            <TabsContent value="expired" className="mt-0">
              <ContractList 
                contracts={expiredContracts} 
              />
            </TabsContent>
            
            <TabsContent value="draft" className="mt-0">
              <ContractList 
                contracts={draftContracts} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
