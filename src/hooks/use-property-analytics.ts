
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchPropertyAnalytics, 
  getUniqueFilterOptions,
  PropertyAnalyticsData, 
  PropertyAnalyticsFilters 
} from '@/api/property-analytics';

export const usePropertyAnalytics = () => {
  const [filters, setFilters] = useState<PropertyAnalyticsFilters>({});

  // Buscar dados das propriedades com filtros aplicados
  const { 
    data: analyticsData = [], 
    isLoading: isLoadingAnalytics, 
    error: analyticsError,
    refetch 
  } = useQuery({
    queryKey: ['property-analytics', filters],
    queryFn: () => fetchPropertyAnalytics(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar opções para filtros
  const { 
    data: filterOptions = { cities: [], neighborhoods: [], types: [], statuses: [] }, 
    isLoading: isLoadingOptions 
  } = useQuery({
    queryKey: ['property-filter-options'],
    queryFn: getUniqueFilterOptions,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<PropertyAnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Estatísticas resumidas
  const summary = {
    totalProperties: analyticsData.length,
    averageROI: analyticsData.length > 0 
      ? analyticsData.reduce((sum, prop) => sum + prop.monthlyROI, 0) / analyticsData.length 
      : 0,
    totalMarketValue: analyticsData.reduce((sum, prop) => sum + prop.marketValue, 0),
    averageVacancy: analyticsData.length > 0 
      ? analyticsData.reduce((sum, prop) => sum + prop.vacancyRate, 0) / analyticsData.length 
      : 0,
    totalMonthlyRevenue: analyticsData.reduce((sum, prop) => sum + prop.averageRevenue, 0)
  };

  return {
    analyticsData,
    filterOptions,
    filters,
    summary,
    isLoading: isLoadingAnalytics || isLoadingOptions,
    error: analyticsError,
    updateFilters,
    clearFilters,
    refetch
  };
};
