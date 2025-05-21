import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Activity, ActivityFormData, ActivityCategory } from '@/types/activity';
import * as ActivitiesAPI from '@/api/activities';

export function useActivities() {
  const queryClient = useQueryClient();
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Buscar todas as atividades
  const { 
    data: activities,
    isLoading: isLoadingActivities,
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ['activities'],
    queryFn: ActivitiesAPI.fetchActivities
  });

  // Buscar uma atividade específica pelo ID
  const {
    data: selectedActivity,
    isLoading: isLoadingSelectedActivity
  } = useQuery({
    queryKey: ['activity', selectedActivityId],
    queryFn: () => selectedActivityId ? ActivitiesAPI.fetchActivityById(selectedActivityId) : null,
    enabled: !!selectedActivityId
  });

  // Buscar categorias de atividades
  const {
    data: categories,
    isLoading: isLoadingCategories
  } = useQuery({
    queryKey: ['activity-categories'],
    queryFn: ActivitiesAPI.fetchActivityCategories
  });

  // Criar uma nova atividade
  const { 
    mutateAsync: createActivity, 
    isPending: isCreating 
  } = useMutation({
    mutationFn: ActivitiesAPI.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({
        title: "Atividade criada",
        description: "A atividade foi criada com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar atividade",
        description: error.message || "Ocorreu um erro ao criar a atividade.",
        variant: "destructive"
      });
    }
  });

  // Atualizar uma atividade existente
  const { 
    mutateAsync: updateActivity, 
    isPending: isUpdating 
  } = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<ActivityFormData> }) => 
      ActivitiesAPI.updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity', selectedActivityId] });
      toast({
        title: "Atividade atualizada",
        description: "A atividade foi atualizada com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar atividade",
        description: error.message || "Ocorreu um erro ao atualizar a atividade.",
        variant: "destructive"
      });
    }
  });

  // Atualizar apenas o status de uma atividade (para drag-and-drop no Kanban)
  const { 
    mutateAsync: updateActivityStatus 
  } = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      ActivitiesAPI.updateActivityStatus(id, status as ActivityStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status da atividade.",
        variant: "destructive"
      });
    }
  });

  // Excluir uma atividade
  const { 
    mutateAsync: deleteActivity, 
    isPending: isDeleting 
  } = useMutation({
    mutationFn: ActivitiesAPI.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({
        title: "Atividade excluída",
        description: "A atividade foi excluída com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir atividade",
        description: error.message || "Ocorreu um erro ao excluir a atividade.",
        variant: "destructive"
      });
    }
  });

  // Converter atividade em despesa
  const { 
    mutateAsync: convertActivityToExpense, 
    isPending: isConverting 
  } = useMutation({
    mutationFn: ActivitiesAPI.convertActivityToExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['property-expenses'] });
      toast({
        title: "Despesa criada",
        description: "A atividade foi convertida em despesa com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar despesa",
        description: error.message || "Ocorreu um erro ao converter a atividade em despesa.",
        variant: "destructive"
      });
    }
  });

  // Criar uma nova categoria
  const { 
    mutateAsync: createCategory, 
    isPending: isCreatingCategory 
  } = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) => 
      ActivitiesAPI.createActivityCategory(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message || "Ocorreu um erro ao criar a categoria.",
        variant: "destructive"
      });
    }
  });

  // Função para buscar atividades de uma propriedade específica
  const fetchPropertyActivities = useCallback(async (propertyId: string) => {
    if (!propertyId) return [];
    return await ActivitiesAPI.fetchActivitiesByProperty(propertyId);
  }, []);

  // Função para buscar categorias de uma atividade específica
  const fetchActivityCategories = useCallback(async (activityId: string) => {
    if (!activityId) return [];
    return await ActivitiesAPI.fetchActivityCategoryRelations(activityId);
  }, []);

  // Filtrar atividades por status para o Kanban
  const getActivitiesByStatus = useCallback((status: string): Activity[] => {
    if (!activities) return [];
    return activities.filter(activity => activity.status === status);
  }, [activities]);

  // Filtrar atividades próximas do vencimento para o Dashboard
  const getUpcomingActivities = useCallback((): Activity[] => {
    if (!activities) return [];
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return activities
      .filter(activity => {
        if (activity.status === 'completed' || activity.status === 'canceled') return false;
        if (!activity.due_date) return false;
        
        const dueDate = new Date(activity.due_date);
        return dueDate <= nextWeek && dueDate >= today;
      })
      .sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [activities]);

  return {
    // Dados
    activities,
    selectedActivity,
    categories,
    
    // Estado de carregamento
    isLoadingActivities,
    isLoadingSelectedActivity,
    isLoadingCategories,
    isCreating,
    isUpdating,
    isDeleting,
    isConverting,
    isCreatingCategory,
    
    // Erros
    activitiesError,
    
    // Ações
    setSelectedActivityId,
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    convertActivityToExpense,
    createCategory,
    fetchPropertyActivities,
    fetchActivityCategories,
    refetchActivities,
    
    // Utilitários
    getActivitiesByStatus,
    getUpcomingActivities
  };
}
