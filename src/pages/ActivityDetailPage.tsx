
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Tag, 
  User, 
  Home, 
  FileText, 
  DollarSign, 
  Check, 
  Edit, 
  Trash, 
  CheckSquare 
} from "lucide-react";

import { useActivities } from "@/hooks/use-activities";
import { useProperties } from "@/hooks/use-properties";
import { useContracts } from "@/hooks/use-contracts";
import { ActivityStatus } from "@/types/activity";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ActivityDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { properties } = useProperties();
  const { contracts } = useContracts();
  
  const { 
    setSelectedActivityId,
    selectedActivity,
    updateActivityStatus,
    deleteActivity,
    convertToExpense,
    refetchSelectedActivity
  } = useActivities();
  
  // Load the activity details when the component mounts
  useEffect(() => {
    if (id) {
      setSelectedActivityId(id);
    } else {
      navigate("/activities");
    }
    
    return () => {
      setSelectedActivityId(null);
    };
  }, [id, setSelectedActivityId, navigate]);
  
  const handleGoBack = () => {
    navigate("/activities");
  };
  
  const handleEdit = () => {
    navigate(`/activities/${id}/edit`);
  };
  
  const handleDelete = async () => {
    if (id) {
      try {
        await deleteActivity(id);
        toast.success("Atividade excluída com sucesso");
        navigate("/activities");
      } catch (error) {
        toast.error("Erro ao excluir atividade");
      }
    }
  };
  
  const handleStatusChange = async (newStatus: ActivityStatus) => {
    if (id) {
      try {
        await updateActivityStatus({ id, status: newStatus });
        refetchSelectedActivity();
        toast.success(`Status atualizado para ${getStatusName(newStatus)}`);
      } catch (error) {
        toast.error("Erro ao atualizar status");
      }
    }
  };
  
  const handleConvertToExpense = async () => {
    if (id) {
      try {
        await convertToExpense(id);
        refetchSelectedActivity();
        toast.success("Atividade convertida em despesa");
      } catch (error) {
        toast.error("Erro ao converter em despesa");
      }
    }
  };
  
  // Helper function to get status name
  const getStatusName = (status: ActivityStatus) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Progresso';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };
  
  // Helper function to get priority className
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Helper function to get type name
  const getTypeName = (type: string) => {
    switch (type) {
      case 'maintenance': return 'Manutenção';
      case 'inspection': return 'Inspeção';
      case 'legal': return 'Legal';
      case 'financial': return 'Financeira';
      case 'other': return 'Outro';
      default: return type;
    }
  };
  
  // Helper function to format date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '--';
    return format(new Date(dateStr), "PPP", { locale: ptBR });
  };
  
  // Find related property and contract
  const relatedProperty = selectedActivity?.property_id
    ? properties.find(p => p.id === selectedActivity.property_id)
    : null;
  
  const relatedContract = selectedActivity?.contract_id
    ? contracts.find(c => c.id === selectedActivity.contract_id)
    : null;

  if (!selectedActivity) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={selectedActivity.title}
        description={`Atividade de ${getTypeName(selectedActivity.activity_type)}`}
        icon={<CheckSquare />}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a atividade.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Detalhes da Atividade</CardTitle>
                  <CardDescription>Informações gerais</CardDescription>
                </div>
                <Badge 
                  className={`${getPriorityClass(selectedActivity.priority)} text-white`}
                >
                  Prioridade {selectedActivity.priority === 'low' ? 'Baixa' : 
                              selectedActivity.priority === 'medium' ? 'Média' : 'Alta'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedActivity.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h4>
                  <p>{selectedActivity.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Datas</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Início: {formatDate(selectedActivity.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Prazo: {formatDate(selectedActivity.due_date)}</span>
                    </div>
                    {selectedActivity.completed_at && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-muted-foreground" />
                        <span>Concluída em: {formatDate(selectedActivity.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Custos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Custo estimado: {selectedActivity.estimated_cost 
                        ? selectedActivity.estimated_cost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) 
                        : '--'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Custo real: {selectedActivity.actual_cost 
                        ? selectedActivity.actual_cost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) 
                        : '--'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Responsible Information */}
              {(selectedActivity.responsible_name || selectedActivity.responsible_contact) && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Responsável</h4>
                  <div className="space-y-2">
                    {selectedActivity.responsible_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Nome: {selectedActivity.responsible_name}</span>
                      </div>
                    )}
                    {selectedActivity.responsible_contact && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Contato: {selectedActivity.responsible_contact}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedActivity.responsible_notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Observações</h4>
                  <p>{selectedActivity.responsible_notes}</p>
                </div>
              )}
              
              {/* Related Items */}
              {(relatedProperty || relatedContract) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Itens Relacionados</h4>
                    <div className="space-y-2">
                      {relatedProperty && (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <Button 
                            variant="link" 
                            className="p-0 h-auto" 
                            onClick={() => navigate(`/properties/detail?id=${relatedProperty.id}`)}
                          >
                            Imóvel: {relatedProperty.title}
                          </Button>
                        </div>
                      )}
                      
                      {relatedContract && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <Button 
                            variant="link" 
                            className="p-0 h-auto" 
                            onClick={() => navigate(`/contracts/detail?id=${relatedContract.id}`)}
                          >
                            Contrato: {relatedContract.title}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Actions Card - Show different actions based on status */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Disponíveis</CardTitle>
              <CardDescription>Gerencie o progresso desta atividade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedActivity.status === 'pending' && (
                  <Button onClick={() => handleStatusChange('in_progress')}>
                    Iniciar Atividade
                  </Button>
                )}
                
                {selectedActivity.status === 'in_progress' && (
                  <Button onClick={() => handleStatusChange('completed')}>
                    Marcar como Concluída
                  </Button>
                )}
                
                {selectedActivity.status !== 'cancelled' && (
                  <Button variant="outline" onClick={() => handleStatusChange('cancelled')}>
                    Cancelar Atividade
                  </Button>
                )}
                
                {selectedActivity.status === 'completed' && !selectedActivity.expense_id && (
                  <Button onClick={handleConvertToExpense}>
                    Converter em Despesa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Status Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Informações resumidas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Status Atual</h4>
                <Badge className={
                  selectedActivity.status === 'pending' ? 'bg-amber-500' : 
                  selectedActivity.status === 'in_progress' ? 'bg-blue-500' : 
                  selectedActivity.status === 'completed' ? 'bg-green-500' : 
                  'bg-gray-500'
                }>
                  {getStatusName(selectedActivity.status as ActivityStatus)}
                </Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tipo</h4>
                <Badge variant="outline">{getTypeName(selectedActivity.activity_type)}</Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Datas</h4>
                <div className="text-sm">
                  <p>Criada em: {formatDate(selectedActivity.created_at)}</p>
                  <p>Última atualização: {formatDate(selectedActivity.updated_at)}</p>
                </div>
              </div>
              
              {selectedActivity.expense_id && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Conversão</h4>
                  <Badge variant="outline" className="bg-green-100">
                    Convertida em despesa
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
