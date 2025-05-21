
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  User, 
  MailOpen, 
  Phone, 
  FileText, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit,
  ArrowLeft,
  UserPlus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClient } from "@/hooks/use-clients";
import { useClientSubscriptions } from "@/hooks/use-client-subscriptions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientUsersList } from "@/components/client-users/client-users-list";
import { ClientUserForm } from "@/components/client-users/client-user-form";

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading: isClientLoading } = useClient(clientId);
  const { data: subscriptions, isLoading: isSubscriptionsLoading } = useClientSubscriptions(clientId);
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const handleAddUserClick = () => {
    setIsAddUserDialogOpen(true);
  };

  const handleUserAddSuccess = () => {
    setIsAddUserDialogOpen(false);
  };

  if (isClientLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
        <h2 className="text-2xl font-semibold mb-2">Cliente não encontrado</h2>
        <p className="text-muted-foreground mb-4">O cliente solicitado não existe ou foi removido.</p>
        <Button variant="outline" onClick={() => navigate("/admin/clients")}>
          Voltar para listagem
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/clients")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <Badge variant={client.is_active ? "default" : "secondary"}>
              {client.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Cliente desde {formatDate(client.created_at)}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/admin/clients/edit/${client.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
            <CardDescription>Dados pessoais e de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>{client.name}</span>
            </div>
            <div className="flex items-center">
              <MailOpen className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.document_number && (
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>Documento: {client.document_number}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>Cadastro: {formatDate(client.created_at)}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>Última atualização: {formatDate(client.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assinaturas</CardTitle>
            <CardDescription>Planos contratados pelo cliente</CardDescription>
          </CardHeader>
          <CardContent>
            {isSubscriptionsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : subscriptions && subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{subscription.plan?.name || "Plano"}</h3>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            Desde {format(new Date(subscription.starts_at), "dd/MM/yyyy")}
                            {subscription.ends_at && ` até ${format(new Date(subscription.ends_at), "dd/MM/yyyy")}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={subscription.status === "active" ? "default" : 
                                  subscription.status === "pending" ? "secondary" : "destructive"}
                        >
                          {subscription.status === "active" ? "Ativa" : 
                           subscription.status === "pending" ? "Pendente" : "Cancelada"}
                        </Badge>
                        <Badge variant="outline">
                          R$ {subscription.plan?.price.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate(`/admin/subscriptions/new?clientId=${client.id}`)}>
                  Adicionar nova assinatura
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 border rounded-md border-dashed">
                <p className="text-muted-foreground mb-2">Este cliente não possui assinaturas</p>
                <Button variant="outline" onClick={() => navigate(`/admin/subscriptions/new?clientId=${client.id}`)}>
                  Adicionar assinatura
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <ClientUsersList 
          clientId={clientId!} 
          onAddUserClick={handleAddUserClick} 
        />

        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <ClientUserForm 
              clientId={clientId!}
              onSuccess={handleUserAddSuccess}
              onCancel={() => setIsAddUserDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
