
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PlusCircle, Loader2, Kanban, ListFilter, CalendarIcon } from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Activity } from '@/types/activity';
import { useActivities } from '@/hooks/use-activities';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { ActivityForm } from '@/components/activities/activity-form';
import { ActivityBoard } from '@/components/activities/activity-board';
import { ActivityList } from '@/components/activities/activity-list';
import { ActivityCalendar } from '@/components/activities/activity-calendar';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useToast } from '@/hooks/use-toast';

export default function ActivitiesPage() {
  const location = useLocation();
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Hooks
  const { 
    activities,
    selectedActivity,
    categories,
    isLoadingActivities,
    isLoadingSelectedActivity,
    isCreating,
    isUpdating,
    isDeleting,
    isConverting,
    setSelectedActivityId,
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    convertActivityToExpense,
    createCategory,
    fetchActivityCategories
  } = useActivities();
  
  const { properties, isLoading: isLoadingProperties } = useProperties();
  const { contracts, isLoading: isLoadingContracts } = useContracts();
  
  // Verificar ID na URL para edição imediata
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const activityId = params.get('id');
    const propertyId = params.get('property_id');
    
    if (activityId) {
      setSelectedActivityId(activityId);
    } else if (propertyId) {
      // Se tiver propertyId na URL, não faz nada especial aqui
      // Isso é tratado automaticamente pelo filtro na ActivityList
    }
  }, [location.search, setSelectedActivityId]);
  
  // Quando o selectedActivity mudar, abrir o dialog de edição
  useEffect(() => {
    if (selectedActivity) {
      setEditingActivity(selectedActivity);
      setFormDialogOpen(true);
    }
  }, [selectedActivity]);
  
  // Carregar categorias da atividade quando estiver editando
  useEffect(() => {
    const loadCategories = async () => {
      if (editingActivity) {
        const categoryIds = await fetchActivityCategories(editingActivity.id);
        setSelectedCategories(categoryIds);
      } else {
        setSelectedCategories([]);
      }
    };
    
    loadCategories();
  }, [editingActivity, fetchActivityCategories]);
  
  const handleCreateActivity = () => {
    setEditingActivity(null);
    setSelectedCategories([]);
    setFormDialogOpen(true);
  };
  
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setFormDialogOpen(true);
  };
  
  const handleDeleteActivity = (activityId: string) => {
    setActivityToDelete(activityId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteActivity = async () => {
    if (activityToDelete) {
      try {
        await deleteActivity(activityToDelete);
        setDeleteDialogOpen(false);
        setActivityToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir atividade:', error);
      }
    }
  };
  
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingActivity) {
        await updateActivity({ id: editingActivity.id, data });
      } else {
        await createActivity(data);
      }
      setFormDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    }
  };
  
  const handleStatusChange = async (activityId: string, newStatus: string) => {
    try {
      await updateActivityStatus({ id: activityId, status: newStatus });
      
      // Mostrar toast de sucesso ao mudar status
      const statusMap: Record<string, string> = {
        pending: 'Pendente',
        in_progress: 'Em andamento',
        completed: 'Concluído',
        canceled: 'Cancelado'
      };
      
      toast({
        title: 'Status atualizado',
        description: `Atividade movida para "${statusMap[newStatus] || newStatus}"`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };
  
  const handleConvertToExpense = async (activityId: string) => {
    try {
      await convertActivityToExpense(activityId);
    } catch (error) {
      console.error('Erro ao converter em despesa:', error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <PageHeader
          title="Atividades"
          description="Gerencie as atividades e tarefas do seu negócio"
        >
          <Button onClick={handleCreateActivity}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Atividade
          </Button>
        </PageHeader>
        
        <Tabs 
          value={view} 
          onValueChange={(value) => setView(value as 'kanban' | 'list' | 'calendar')}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="kanban">
                <Kanban className="h-4 w-4 mr-2" />
                Quadro Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListFilter className="h-4 w-4 mr-2" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendário
              </TabsTrigger>
            </TabsList>
          </div>
          
          {isLoadingActivities ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando atividades...</span>
            </div>
          ) : (
            <>
              <TabsContent value="kanban" className="m-0">
                <ActivityBoard
                  activities={activities || []}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditActivity}
                  onDelete={handleDeleteActivity}
                  onConvert={handleConvertToExpense}
                />
              </TabsContent>
              
              <TabsContent value="list" className="m-0">
                <ActivityList
                  activities={activities || []}
                  isLoading={isLoadingActivities}
                  onAdd={handleCreateActivity}
                  onEdit={handleEditActivity}
                  onDelete={handleDeleteActivity}
                  onConvert={handleConvertToExpense}
                />
              </TabsContent>
              
              <TabsContent value="calendar" className="m-0">
                <ActivityCalendar
                  activities={activities || []}
                  onEdit={handleEditActivity}
                  onDelete={handleDeleteActivity}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
        
        {/* Dialog para criação/edição de atividade */}
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editingActivity ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
            </DialogHeader>
            <ActivityForm
              activity={editingActivity || undefined}
              properties={properties}
              contracts={contracts}
              categories={categories}
              selectedCategories={selectedCategories}
              onSubmit={handleFormSubmit}
              onCancel={() => setFormDialogOpen(false)}
              onCreateCategory={createCategory}
              isSubmitting={isCreating || isUpdating}
            />
          </DialogContent>
        </Dialog>
        
        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteActivity}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndProvider>
  );
}
