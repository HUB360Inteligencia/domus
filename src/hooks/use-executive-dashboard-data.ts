import { useMemo } from 'react';
import { useRealRentalData } from '@/hooks/use-real-rental-data';

export const useExecutiveDashboardData = () => {
  const { 
    analyticsData, 
    alerts, 
    goalsProgress, 
    kpiData, 
    isLoading 
  } = useRealRentalData();

  // Calcular dados de distribuição por tipo de propriedade baseado em dados reais
  const propertyTypeData = useMemo(() => {
    // Este cálculo será baseado em dados reais das propriedades
    // Por enquanto retornamos array vazio, será implementado quando necessário
    return [];
  }, []);

  return {
    kpiData,
    revenueData: analyticsData,
    propertyTypeData,
    alerts,
    goals: goalsProgress,
    isLoading
  };
};
