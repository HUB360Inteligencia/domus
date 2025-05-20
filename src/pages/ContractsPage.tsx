
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useContracts } from "@/hooks/use-contracts";
import { ContractList } from "@/components/contract-list";
import { Loader2 } from "lucide-react";

export default function ContractsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { contracts, isLoadingContracts } = useContracts();
  
  // Filter contracts by status and search term
  const filterContracts = (status: string) => {
    return contracts.filter(contract => 
      (status === "all" || contract.status === status) && 
      (contract.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       contract.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };
  
  const activeContracts = filterContracts("active");
  const pendingContracts = filterContracts("pending");
  const expiredContracts = filterContracts("expired");
  const canceledContracts = filterContracts("canceled");

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
      
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar contratos..."
            className="pl-8 w-full bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full justify-start border-b pb-0 mb-6">
              <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Ativos ({activeContracts.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Pendentes ({pendingContracts.length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Expirados ({expiredContracts.length})
              </TabsTrigger>
              <TabsTrigger value="canceled" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Cancelados ({canceledContracts.length})
              </TabsTrigger>
            </TabsList>
            
            {isLoadingContracts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="active">
                  <ContractList contracts={activeContracts} emptyMessage="Nenhum contrato ativo encontrado." />
                </TabsContent>
                <TabsContent value="pending">
                  <ContractList contracts={pendingContracts} emptyMessage="Nenhum contrato pendente encontrado." />
                </TabsContent>
                <TabsContent value="expired">
                  <ContractList contracts={expiredContracts} emptyMessage="Nenhum contrato expirado encontrado." />
                </TabsContent>
                <TabsContent value="canceled">
                  <ContractList contracts={canceledContracts} emptyMessage="Nenhum contrato cancelado encontrado." />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
