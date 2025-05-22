
import { useQuery } from '@tanstack/react-query';
import { 
  fetchActivities, 
  fetchActivityById, 
  fetchActivitiesByProperty, 
  fetchActivitiesByContract 
} from '@/api/activities';

export const useActivityQueries = (
  selectedActivityId: string | null = null,
  propertyId: string | null = null,
  contractId: string | null = null
) => {
  // Fetch all activities
  const { 
    data: activities = [], 
    isLoading: isLoadingActivities, 
    refetch: refetchActivities 
  } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
  
  // Fetch selected activity details
  const { 
    data: selectedActivity, 
    isLoading: isLoadingSelectedActivity,
    refetch: refetchSelectedActivity 
  } = useQuery({
    queryKey: ['activity', selectedActivityId],
    queryFn: () => fetchActivityById(selectedActivityId || ''),
    enabled: !!selectedActivityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch activities by property
  const {
    data: propertyActivities = [],
    isLoading: isLoadingPropertyActivities,
    refetch: refetchPropertyActivities
  } = useQuery({
    queryKey: ['activities', 'property', propertyId],
    queryFn: () => fetchActivitiesByProperty(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch activities by contract
  const {
    data: contractActivities = [],
    isLoading: isLoadingContractActivities,
    refetch: refetchContractActivities
  } = useQuery({
    queryKey: ['activities', 'contract', contractId],
    queryFn: () => fetchActivitiesByContract(contractId || ''),
    enabled: !!contractId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return {
    activities,
    selectedActivity,
    propertyActivities,
    contractActivities,
    isLoadingActivities,
    isLoadingSelectedActivity,
    isLoadingPropertyActivities,
    isLoadingContractActivities,
    refetchActivities,
    refetchSelectedActivity,
    refetchPropertyActivities,
    refetchContractActivities,
    isLoading: isLoadingActivities || isLoadingSelectedActivity || 
               isLoadingPropertyActivities || isLoadingContractActivities
  };
};
