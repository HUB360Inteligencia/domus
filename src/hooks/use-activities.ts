
import { useState, useCallback } from 'react';
import { Activity, ActivityFormData, ActivityStatus, ActivityFilters } from '@/types/activity';
import { useActivityQueries } from './use-activity-queries';
import { useActivityMutations } from './use-activity-mutations';

export const useActivities = (
  propertyId: string | null = null,
  contractId: string | null = null
) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({});

  const setSelectedActivityIdCallback = useCallback((id: string | null) => {
    setSelectedActivityId(id);
  }, []);

  const { 
    activities, 
    selectedActivity,
    propertyActivities,
    contractActivities,
    isLoading,
    isLoadingActivities,
    refetchActivities,
    refetchSelectedActivity,
    refetchPropertyActivities,
    refetchContractActivities
  } = useActivityQueries(selectedActivityId, propertyId, contractId);

  const {
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    convertToExpense,
    isCreating,
    isUpdating,
    isUpdatingStatus,
    isDeleting,
    isConverting
  } = useActivityMutations();

  // Apply filters to activities
  const filteredActivities = useCallback(() => {
    let result = [...activities];
    
    if (filters.status && filters.status.length > 0) {
      result = result.filter(a => filters.status?.includes(a.status));
    }
    
    if (filters.priority && filters.priority.length > 0) {
      result = result.filter(a => filters.priority?.includes(a.priority));
    }
    
    if (filters.type && filters.type.length > 0) {
      result = result.filter(a => filters.type?.includes(a.activity_type));
    }
    
    if (filters.propertyId) {
      result = result.filter(a => a.property_id === filters.propertyId);
    }
    
    if (filters.contractId) {
      result = result.filter(a => a.contract_id === filters.contractId);
    }

    // Filter by responsible name (supplier)
    if (filters.responsibleName) {
      result = result.filter(a => 
        a.responsible_name && a.responsible_name.toLowerCase().includes(filters.responsibleName!.toLowerCase())
      );
    }

    // We need to get property data for each activity to filter by neighborhood/city
    // For now we'll leave a placeholder logic that assumes we have this data
    // This would need to be implemented with a join or separate query in a real app
    if (filters.neighborhood || filters.city) {
      // Placeholder for neighborhood/city filtering
      // In a real implementation, we'd need to join with properties table
      // or preload property data with activities
      console.log("Filtering by neighborhood/city would require more data");
    }
    
    if (filters.dueDateRange && (filters.dueDateRange.from || filters.dueDateRange.to)) {
      result = result.filter(a => {
        if (!a.due_date) return false;
        
        const dueDate = new Date(a.due_date);
        const from = filters.dueDateRange?.from ? new Date(filters.dueDateRange.from) : null;
        const to = filters.dueDateRange?.to ? new Date(filters.dueDateRange.to) : null;
        
        if (from && to) {
          return dueDate >= from && dueDate <= to;
        } else if (from) {
          return dueDate >= from;
        } else if (to) {
          return dueDate <= to;
        }
        
        return true;
      });
    }
    
    return result;
  }, [activities, filters]);

  // Group activities by status for board view - return the array directly
  const groupedActivities = useCallback(() => {
    const filtered = filteredActivities();
    const pending = filtered.filter(a => a.status === 'pending');
    const inProgress = filtered.filter(a => a.status === 'in_progress');
    const completed = filtered.filter(a => a.status === 'completed');
    const cancelled = filtered.filter(a => a.status === 'cancelled');
    
    return [
      { id: 'pending' as ActivityStatus, title: 'Pendentes', activities: pending },
      { id: 'in_progress' as ActivityStatus, title: 'Em Progresso', activities: inProgress },
      { id: 'completed' as ActivityStatus, title: 'Concluídas', activities: completed },
      { id: 'cancelled' as ActivityStatus, title: 'Canceladas', activities: cancelled }
    ];
  }, [filteredActivities]);

  const handleStatusChange = useCallback((id: string, newStatus: ActivityStatus) => {
    updateActivityStatus({ id, status: newStatus });
  }, [updateActivityStatus]);

  const handleFilterChange = useCallback((newFilters: ActivityFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    // Data
    activities,
    filteredActivities: filteredActivities(),
    groupedActivities: groupedActivities(), // Call the function here instead of returning the function
    selectedActivity,
    propertyActivities,
    contractActivities,
    
    // Actions
    setSelectedActivityId: setSelectedActivityIdCallback,
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    convertToExpense,
    handleStatusChange,
    handleFilterChange,
    
    // Refetch functions
    refetchActivities,
    refetchSelectedActivity,
    
    // Loading states
    isLoading,
    isLoadingActivities,
    isCreating,
    isUpdating,
    isUpdatingStatus,
    isDeleting,
    isConverting
  };
};
