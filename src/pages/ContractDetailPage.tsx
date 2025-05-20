
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Edit, File, Loader2, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContracts } from "@/hooks/use-contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DocumentCard } from "@/components/document-card";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

export default function ContractDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get("id");
  const { 
    setSelectedContractId, 
    selectedContract, 
    contractDocuments,
    isLoadingSelectedContract,
    isLoadingContractDocuments,
    deleteContract,
    deleteDocument
  } = useContracts();

  useEffect(() => {
    if (contractId) {
      setSelectedContractId(contractId);
    } else {
      navigate("/contracts");
    }
  }, [contractId, setSelectedContractId, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDelete = async () => {
    if (!selectedContract?.id) return;
    
    const confirmed = window.confirm("Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.");
    
    if (confirmed) {
      try {
        await deleteContract(selectedContract.id);
        toast.success("Contrato excluído com sucesso");
        navigate("/contracts");
      } catch (error) {
        toast.error("Erro ao excluir contrato");
      }
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.");
    
    if (confirmed) {
      try {
        await deleteDocument(documentId);
        toast.success("Documento excluído com sucesso");
      } catch (error) {
        toast.error("Erro ao excluir documento");
      }
    }
  };

  const handleViewDocument = (documentId: string) => {
    window.open(`/documents/view?id=${documentId}`, '_blank');
  };

  const handleDownloadDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'expired': 'bg-red-100 text-red-800',
      'canceled': 'bg-gray-100 text-gray-800',
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSignatureStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'unsigned': 'bg-gray-100 text-gray-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoadingSelectedContract) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedContract) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center space-y-4">
        <p className="text-lg text-muted-foreground">Contrato não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/contracts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Contratos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{selectedContract.title}</h1>
          <Badge className={getStatusColor(selectedContract.status)}>
            {selectedContract.status === 'active' ? 'Ativo' : 
             selectedContract.status === 'pending' ? 'Pendente' : 
             selectedContract.status === 'expired' ? 'Expirado' : 'Cancelado'}
          </Badge>
          <Badge className={getSignatureStatusColor(selectedContract.signature_status)}>
            {selectedContract.signature_status === 'completed' ? 'Assinado' : 
             selectedContract.signature_status === 'pending' ? 'Pendente' : 
             selectedContract.signature_status === 'unsigned' ? 'Não assinado' : 'Rejeitado'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/contracts/edit?id=${selectedContract.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Início</p>
                <p>{format(new Date(selectedContract.start_date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Término</p>
                <p>{format(new Date(selectedContract.end_date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p>{formatCurrency(selectedContract.value)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dia de pagamento</p>
                <p>{selectedContract.payment_day}</p>
              </div>
              {selectedContract.deposit_value && (
                <div>
                  <p className="text-sm text-muted-foreground">Valor do depósito</p>
                  <p>{formatCurrency(selectedContract.deposit_value)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p>{format(new Date(selectedContract.created_at), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Imóvel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedContract.property ? (
              <div className="space-y-2">
                <p><span className="font-medium">Título:</span> {selectedContract.property.title}</p>
                <p><span className="font-medium">Endereço:</span> {selectedContract.property.address}</p>
                <p><span className="font-medium">Cidade:</span> {selectedContract.property.city}</p>
                <p><span className="font-medium">Estado:</span> {selectedContract.property.state}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum imóvel vinculado a este contrato.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Inquilino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p>{selectedContract.tenant_name}</p>
              </div>
              {selectedContract.tenant_document && (
                <div>
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <p>{selectedContract.tenant_document}</p>
                </div>
              )}
              {selectedContract.tenant_contact && (
                <div>
                  <p className="text-sm text-muted-foreground">Contato</p>
                  <p>{selectedContract.tenant_contact}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Termos e Condições</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedContract.terms ? (
              <div className="prose prose-sm max-w-none">
                <p>{selectedContract.terms}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum termo especificado.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documentos</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate(`/documents/new?contract_id=${selectedContract.id}`)}>
              <File className="mr-2 h-4 w-4" />
              Adicionar Documento
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingContractDocuments ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contractDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onView={() => handleViewDocument(document.id)}
                    onDownload={() => handleDownloadDocument(document.file_path)}
                    onDelete={() => handleDeleteDocument(document.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">
                Nenhum documento anexado a este contrato.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
