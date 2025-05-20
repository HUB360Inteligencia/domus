
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, File, Edit, Trash, AlertCircle, Check, X, Download } from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { useContracts } from "@/hooks/use-contracts";
import { Document } from "@/types/contract";

export default function ContractDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const contractId = queryParams.get("id");
  
  const { 
    selectedContract, 
    contractDocuments, 
    setSelectedContractId,
    isLoadingSelectedContract,
    deleteContract,
    updateContractStatus,
    downloadDocument
  } = useContracts();

  useEffect(() => {
    if (contractId) {
      setSelectedContractId(contractId);
    } else {
      navigate("/contracts");
    }
  }, [contractId, setSelectedContractId, navigate]);

  if (isLoadingSelectedContract || !selectedContract) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      const { url, filename } = await downloadDocument(document);
      
      // Create a temporary anchor element to download the file
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={selectedContract.title}
        description={`Contrato criado em ${new Date(selectedContract.created_at).toLocaleDateString()}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/contracts/edit?id=${contractId}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => {
            if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
              deleteContract(selectedContract.id);
              navigate("/contracts");
            }
          }}>
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Contrato</CardTitle>
              <div className="flex items-center">
                <Badge variant={
                  selectedContract.status === "active" ? "success" :
                  selectedContract.status === "pending" ? "warning" :
                  selectedContract.status === "expired" ? "destructive" :
                  "outline"
                }>
                  {selectedContract.status === "active" ? "Ativo" :
                   selectedContract.status === "pending" ? "Pendente" :
                   selectedContract.status === "expired" ? "Expirado" :
                   selectedContract.status === "draft" ? "Rascunho" :
                   selectedContract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-1">Descrição</h3>
                <p className="text-muted-foreground">
                  {selectedContract.description || "Sem descrição"}
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Data de Início</h3>
                  <p className="text-muted-foreground">
                    {selectedContract.start_date 
                      ? new Date(selectedContract.start_date).toLocaleDateString()
                      : "Não definida"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Data de Término</h3>
                  <p className="text-muted-foreground">
                    {selectedContract.end_date 
                      ? new Date(selectedContract.end_date).toLocaleDateString()
                      : "Não definida"}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Valor do Contrato</h3>
                  <p className="text-muted-foreground">
                    {selectedContract.value 
                      ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(selectedContract.value)
                      : "Não definido"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Tipo de Contrato</h3>
                  <p className="text-muted-foreground">
                    {selectedContract.contract_type || "Não definido"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>Documentos relacionados a este contrato</CardDescription>
            </CardHeader>
            <CardContent>
              {contractDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <File className="h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Nenhum documento encontrado para este contrato
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate(`/documents/new?contract_id=${contractId}`)}
                  >
                    Adicionar Documento
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractDocuments.map((doc) => (
                    <Card key={doc.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col h-full">
                          <div className="p-4">
                            <h3 className="text-sm font-medium">{doc.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Adicionado em {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <CardFooter className="border-t p-2 flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleDownloadDocument(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col">
                <Button
                  variant={selectedContract.status === "active" ? "default" : "outline"}
                  className="justify-start mb-2"
                  onClick={() => updateContractStatus(selectedContract.id, "active")}
                >
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Marcar como Ativo
                </Button>
                
                <Button
                  variant={selectedContract.status === "pending" ? "default" : "outline"}
                  className="justify-start mb-2"
                  onClick={() => updateContractStatus(selectedContract.id, "pending")}
                >
                  <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                  Marcar como Pendente
                </Button>
                
                <Button
                  variant={selectedContract.status === "expired" ? "default" : "outline"}
                  className="justify-start mb-2"
                  onClick={() => updateContractStatus(selectedContract.id, "expired")}
                >
                  <X className="mr-2 h-4 w-4 text-red-500" />
                  Marcar como Expirado
                </Button>
                
                <Button
                  variant={selectedContract.status === "draft" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => updateContractStatus(selectedContract.id, "draft")}
                >
                  <File className="mr-2 h-4 w-4 text-gray-500" />
                  Marcar como Rascunho
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
