
import { useState, useEffect } from 'react';
import { PlusCircle, Loader2, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivities } from '@/hooks/use-activities';
import { ActivityForm } from './activity-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Activity } from '@/types/activity';
import { Link } from 'react-router-dom';

interface PropertyActivitiesProps {
  propertyId: string;
}

export function PropertyActivities({ propertyId }: PropertyActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const { 
    categories,
    isLoadingCategories,
    createActivity, 
    updateActivity, 
    fetchPropertyActivities,
    fetchActivityCategories,
    createCategory,
    isCreating,
    isUpdating
  } = useActivities();
  
  // Carregar atividades da propriedade
  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPropertyActivities(propertyId);
        setActivities(data);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (propertyId) {
      loadActivities();
    }
  }, [propertyId, fetchPropertyActivities]);
  
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
  
  const handleAddActivity = () => {
    setEditingActivity(null);
    setSelectedCategories([]);
    setFormDialogOpen(true);
  };
  
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setFormDialogOpen(true);
  };
  
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingActivity) {
        await updateActivity({ id: editingActivity.id, data });
      } else {
        await createActivity({
          ...data,
          property_id: propertyId
        });
      }
      
      // Recarregar atividades
      const updatedActivities = await fetchPropertyActivities(propertyId);
      setActivities(updatedActivities);
      setFormDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando atividades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Atividades do Imóvel</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asComponent={Link} 
            to={`/activities?property_id=${propertyId}`}
          >
            <LayoutList className="h-4 w-4 mr-2" />
            Ver Todas
          </Button>
          <Button size="sm" onClick={handleAddActivity}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {activities.length > 0 ? (
          activities.map(activity => (
            <div 
              key={activity.id} 
              className="p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleEditActivity(activity)}
            >
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  activity.priority === 'high' ? 'bg-red-500' :
                  activity.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <span className="font-medium">{activity.title}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-auto">
                  {activity.status === 'pending' ? 'Pendente' :
                   activity.status === 'in_progress' ? 'Em andamento' :
                   activity.status === 'completed' ? 'Concluído' : 'Cancelado'}
                </span>
              </div>
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1 ml-5">
                  {activity.description}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>Não há atividades para este imóvel.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleAddActivity}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Atividade
            </Button>
          </div>
        )}
      </div>
      
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
          </DialogHeader>
          <ActivityForm
            activity={editingActivity || undefined}
            categories={categories}
            selectedCategories={selectedCategories}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormDialogOpen(false)}
            onCreateCategory={createCategory}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
