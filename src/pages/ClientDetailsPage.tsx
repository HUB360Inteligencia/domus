
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClient } from "@/hooks/use-clients";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  Edit, 
  ChevronLeft, 
  Plus 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientDetailsProps {
  isNew?: boolean;
  isEdit?: boolean;
}

export default function ClientDetailsPage({ isNew = false, isEdit = false }: ClientDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, isError } = useClient(id);
  
  useEffect(() => {
    if (isNew) {
      // Redirect to the form page for new clients
      navigate("/clients/new");
    } else if (isEdit && id) {
      // Redirect to the edit form page with the correct ID
      navigate(`/clients/edit/${id}`);
    }
  }, [isNew, isEdit, id, navigate]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Cliente não encontrado</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">O cliente solicitado não existe ou foi removido.</p>
            <Button onClick={() => navigate("/clients")}>Voltar para a lista</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <PageHeader 
            title={client.name} 
            description={`Cliente desde ${formatDate(client.created_at)}`} 
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/clients/edit/${client.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="properties">Imóveis</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do cliente</CardTitle>
              <CardDescription>Dados cadastrais e informações de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-medium">Nome:</span>
                    <span className="ml-2">{client.name}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{client.email}</span>
                  </div>
                  
                  {client.phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span className="font-medium">Telefone:</span>
                      <span className="ml-2">{client.phone}</span>
                    </div>
                  )}
                  
                  {client.document_number && (
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span className="font-medium">Documento:</span>
                      <span className="ml-2">{client.document_number}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-medium">Cadastro:</span>
                    <span className="ml-2">{formatDate(client.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-medium">Última atualização:</span>
                    <span className="ml-2">{formatDate(client.updated_at)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium">Status:</span>
                    <Badge variant={client.is_active ? "default" : "secondary"} className="ml-2">
                      {client.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="properties" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Imóveis do cliente</h3>
            <Button size="sm" onClick={() => navigate("/properties/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar imóvel
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                Nenhum imóvel associado a este cliente ainda.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contracts" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Contratos do cliente</h3>
            <Button size="sm" onClick={() => navigate("/contracts/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar contrato
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                Nenhum contrato associado a este cliente ainda.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
