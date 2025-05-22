
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckSquare, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  Tag, 
  AlertTriangle, 
  Building, 
  FileText 
} from "lucide-react";

import { useActivities } from "@/hooks/use-activities";
import { useProperties } from "@/hooks/use-properties";
import { useContracts } from "@/hooks/use-contracts";
import { ActivityStatus, ActivityType, ActivityPriority } from "@/types/activity";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ActivityDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get("id");
  
  const { selectedActivity, setSelectedActivityId, deleteActivity, isDeleting } = useActivities();
  const { properties } = useProperties();
  const { contracts } = useContracts();
  
  useEffect(() => {
    if (activityId) {
      setSelectedActivityId(activityId);
    } else {
      navigate("/activities");
    }
  }, [activityId, navigate, setSelectedActivityId]);
  
  // Find related property and contract
  const relatedProperty = selectedActivity?.property_id 
    ? properties.find(p => p.id === selectedActivity.property_id) 
    : undefined;
    
  const relatedContract = selectedActivity?.contract_id 
    ? contracts.find(c => c.id === selectedActivity.contract_id) 
    : undefined;
  
  // Format date helpers
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Não definida";
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  // Status config
  const getStatusConfig = (status: ActivityStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pendente", color: "bg-amber-500" };
      case "in_progress":
        return { label: "Em Progresso", color: "bg-blue-500" };
      case "completed":
        return { label: "Concluída", color: "bg-green-500" };
      case "cancelled":
        return { label: "Cancelada", color: "bg-red-500" };
    }
  };
  
  // Priority config
  const getPriorityConfig = (priority: ActivityPriority) => {
    switch (priority) {
      case "low":
        return { label: "Baixa", color: "bg-blue-500" };
      case "medium":
        return { label: "Média", color: "bg-amber-500" };
      case "high":
        return { label: "Alta", color: "bg-red-500" };
    }
  };
  
  // Activity type config
  const getTypeConfig = (type: ActivityType) => {
    switch (type) {
      case "maintenance":
        return { label: "Manutenção", icon: AlertTriangle };
      case "inspection":
        return { label: "Inspeção", icon: Tag };
      case "legal":
        return { label: "Legal", icon: FileText };
      case "financial":
        return { label: "Financeira", icon: DollarSign };
      case "other":
        return { label: "Outro", icon: Tag };
    }
  };
  
  // Handle delete activity
  const handleDeleteActivity = async () => {
    if (selectedActivity?.id) {
      await deleteActivity(selectedActivity.id);
      navigate("/activities");
    }
  };
  
  // Handle edit activity
  const handleEditActivity = () => {
    if (selectedActivity?.id) {
      navigate(`/activities/edit?id=${selectedActivity.id}`);
    }
  };
  
  if (!selectedActivity) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Detalhes da Atividade"
          description="Carregando informações..."
          icon={<CheckSquare />}
        >
          <Button variant="outline" onClick={() => navigate("/activities")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </PageHeader>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const statusConfig = getStatusConfig(selectedActivity.status);
  const priorityConfig = getPriorityConfig(selectedActivity.priority);
  const typeConfig = getTypeConfig(selectedActivity.activity_type);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Detalhes da Atividade"
        description={selectedActivity.title}
        icon={<CheckSquare />}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/activities")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Button variant="outline" onClick={handleEditActivity}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Atividade</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteActivity}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? "Excluindo..." : "Sim, excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedActivity.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${statusConfig.color} text-white`}
                >
                  {statusConfig.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${priorityConfig.color} text-white`}
                >
                  {priorityConfig.label}
                </Badge>
              </div>
            </div>
            <CardDescription className="flex items-center gap-1">
              <typeConfig.icon className="h-4 w-4" />
              <span>{typeConfig.label}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground">
                {selectedActivity.description || "Nenhuma descrição fornecida."}
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Data e Prazos</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Início: {formatDate(selectedActivity.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Prazo: {formatDate(selectedActivity.due_date)}</span>
                  </div>
                  {selectedActivity.completed_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span>Concluído em: {formatDate(selectedActivity.completed_at)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Custos</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Custo estimado: {
                        selectedActivity.estimated_cost 
                          ? selectedActivity.estimated_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : "Não informado"
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Custo real: {
                        selectedActivity.actual_cost 
                          ? selectedActivity.actual_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : "Não informado"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Responsável</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedActivity.responsible_name || "Não informado"}</span>
                </div>
                {selectedActivity.responsible_contact && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedActivity.responsible_contact}</span>
                  </div>
                )}
              </div>
              {selectedActivity.responsible_notes && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{selectedActivity.responsible_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Itens Relacionados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Imóvel</h3>
              {relatedProperty ? (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate(`/properties/detail?id=${relatedProperty.id}`)}
                  >
                    {relatedProperty.title}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum imóvel associado
                </p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Contrato</h3>
              {relatedContract ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Button 
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/contracts/detail?id=${relatedContract.id}`)}
                  >
                    {relatedContract.title}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum contrato associado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
