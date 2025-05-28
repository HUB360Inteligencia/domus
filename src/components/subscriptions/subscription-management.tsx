
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useClientSubscriptions, useCancelSubscription } from "@/hooks/use-subscriptions";
import { SubscriptionForm } from "./subscription-form";

interface SubscriptionManagementProps {
  clientId: string;
}

export function SubscriptionManagement({ clientId }: SubscriptionManagementProps) {
  const [editingSubscription, setEditingSubscription] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { data: subscriptions, isLoading, refetch } = useClientSubscriptions(clientId);
  const cancelMutation = useCancelSubscription();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Em atraso";
      default:
        return status;
    }
  };

  const handleEditSubscription = (subscriptionId: string) => {
    navigate(`/admin/subscriptions/edit/${subscriptionId}?clientId=${clientId}`);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await cancelMutation.mutateAsync(subscriptionId);
      setSubscriptionToCancel(null);
      refetch();
      toast.success("Assinatura cancelada com sucesso");
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      toast.error("Erro ao cancelar assinatura");
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setEditingSubscription(null);
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </div>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-md p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assinaturas</CardTitle>
            <CardDescription>Gerencie as assinaturas deste cliente</CardDescription>
          </div>
          <Button onClick={() => navigate(`/admin/subscriptions/new?clientId=${clientId}`)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Assinatura
          </Button>
        </CardHeader>
        <CardContent>
          {subscriptions && subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(subscription.status)}
                        <h3 className="font-medium">{subscription.plan?.name || "Plano"}</h3>
                        <Badge variant="outline">
                          R$ {subscription.plan?.price.toFixed(2) || "0,00"}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            Desde {format(new Date(subscription.starts_at), "dd/MM/yyyy", { locale: ptBR })}
                            {subscription.ends_at && ` até ${format(new Date(subscription.ends_at), "dd/MM/yyyy", { locale: ptBR })}`}
                          </span>
                        </div>
                      </div>
                      {subscription.plan?.description && (
                        <p className="text-sm text-muted-foreground">
                          {subscription.plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right space-y-1">
                        <Badge variant={subscription.status === "active" ? "default" : 
                                      subscription.status === "pending" ? "secondary" : "destructive"}>
                          {getStatusText(subscription.status)}
                        </Badge>
                        <Badge variant={getPaymentStatusVariant(subscription.payment_status)}>
                          {getPaymentStatusText(subscription.payment_status)}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEditSubscription(subscription.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {subscription.status !== "cancelled" && (
                            <DropdownMenuItem 
                              onSelect={() => setSubscriptionToCancel(subscription.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 border rounded-md border-dashed">
              <p className="text-muted-foreground mb-2">Este cliente não possui assinaturas</p>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/admin/subscriptions/new?clientId=${clientId}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira assinatura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação para cancelar assinatura */}
      <AlertDialog open={!!subscriptionToCancel} onOpenChange={() => setSubscriptionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => subscriptionToCancel && handleCancelSubscription(subscriptionToCancel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
