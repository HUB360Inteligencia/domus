
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchFinancialMetrics, 
  fetchMonthlyFinancialData, 
  fetchPropertyFinancialRanking,
  FinancialMetrics,
  MonthlyFinancialData,
  PropertyFinancialRanking
} from '@/api/financial-dashboard';

// Formatting utilities
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const useFinancialDashboard = () => {
  // State for UI controls
  const [showMarketValue, setShowMarketValue] = useState(true);
  const [propertyRankingType, setPropertyRankingType] = useState<'value' | 'percentage'>('value');
  const [neighborhoodRankingType, setNeighborhoodRankingType] = useState<'value' | 'percentage'>('value');
  const [chartViewMode, setChartViewMode] = useState<'monthly' | 'yearly'>('monthly');

  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics
  } = useQuery<FinancialMetrics>({
    queryKey: ['financial-metrics'],
    queryFn: fetchFinancialMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: monthlyData = [],
    isLoading: isLoadingMonthlyData,
    refetch: refetchMonthlyData
  } = useQuery<MonthlyFinancialData[]>({
    queryKey: ['monthly-financial-data'],
    queryFn: () => fetchMonthlyFinancialData(12),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: propertyRankings = [],
    isLoading: isLoadingRankings,
    refetch: refetchRankings
  } = useQuery<PropertyFinancialRanking[]>({
    queryKey: ['property-financial-rankings'],
    queryFn: fetchPropertyFinancialRanking,
    staleTime: 1000 * 60 * 5,
  });

  // Transform data for UI components
  const assetValueData = useMemo(() => {
    if (!metrics) {
      return {
        acquisition: 'R$ 0,00',
        current: 'R$ 0,00',
        growthPercentage: 0
      };
    }

    const acquisition = metrics.totalAcquisitionValue || 0;
    const current = showMarketValue ? (metrics.totalMarketValue || 0) : (metrics.totalBookValue || 0);
    const growth = acquisition > 0 ? ((current - acquisition) / acquisition) * 100 : 0;

    return {
      acquisition: formatCurrency(acquisition),
      current: formatCurrency(current),
      growthPercentage: growth
    };
  }, [metrics, showMarketValue]);

  const performanceData = useMemo(() => {
    if (!metrics) {
      return {
        monthlyAverage: 'R$ 0,00',
        previousMonth: {
          percentage: '0,00%',
          value: 'R$ 0,00',
          trend: 'neutral' as const
        },
        occupancyRate: '0,00%'
      };
    }

    const monthlyAvg = metrics.averageMonthlyReturn || 0;
    const prevMonth = metrics.previousMonthReturn || 0;
    const occupancy = metrics.occupancyRate || 0;
    
    const trend = prevMonth > monthlyAvg ? 'up' : prevMonth < monthlyAvg ? 'down' : 'neutral';

    return {
      monthlyAverage: formatCurrency(monthlyAvg),
      previousMonth: {
        percentage: formatPercentage(prevMonth),
        value: formatCurrency(prevMonth),
        trend
      },
      occupancyRate: formatPercentage(occupancy)
    };
  }, [metrics]);

  const assetGrowthData = useMemo(() => {
    return monthlyData.map(item => ({
      month: item.month,
      fullLabel: item.month,
      year: new Date().getFullYear(),
      value: showMarketValue ? (item.marketValue || 0) : (item.bookValue || 0),
      acquisition: item.acquisitionValue || 0
    }));
  }, [monthlyData, showMarketValue]);

  const roiByPropertyType = useMemo(() => {
    if (!metrics?.roiByPropertyType) return [];
    
    return Object.entries(metrics.roiByPropertyType).map(([type, roi]) => ({
      type,
      roi: roi || 0
    }));
  }, [metrics]);

  const topPropertiesData = useMemo(() => {
    return propertyRankings.slice(0, 5).map(property => ({
      id: property.id,
      name: property.name,
      type: property.type || 'Residencial',
      location: property.location || 'Não informado',
      return: property.monthlyReturn || 0,
      percentage: property.returnPercentage || 0
    }));
  }, [propertyRankings]);

  const neighborhoodData = useMemo(() => {
    // Group properties by neighborhood and calculate totals
    const neighborhoods = propertyRankings.reduce((acc, property) => {
      const neighborhood = property.neighborhood || 'Não informado';
      if (!acc[neighborhood]) {
        acc[neighborhood] = {
          id: neighborhood,
          name: neighborhood,
          properties: 0,
          totalReturn: 0,
          averageReturn: 0
        };
      }
      acc[neighborhood].properties += 1;
      acc[neighborhood].totalReturn += property.monthlyReturn || 0;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and convert to array
    return Object.values(neighborhoods).map((neighborhood: any) => ({
      ...neighborhood,
      averageReturn: neighborhood.properties > 0 ? neighborhood.totalReturn / neighborhood.properties : 0
    }));
  }, [propertyRankings]);

  return {
    // Original API data
    metrics,
    monthlyData,
    propertyRankings,
    
    // Transformed data for UI
    assetValueData,
    performanceData,
    assetGrowthData,
    roiByPropertyType,
    topPropertiesData,
    neighborhoodData,
    
    // UI state
    showMarketValue,
    setShowMarketValue,
    propertyRankingType,
    setPropertyRankingType,
    neighborhoodRankingType,
    setNeighborhoodRankingType,
    chartViewMode,
    setChartViewMode,
    
    // Loading states
    isLoading: isLoadingMetrics || isLoadingMonthlyData || isLoadingRankings,
    isLoadingMetrics,
    isLoadingMonthlyData,
    isLoadingRankings,
    
    // Refetch functions
    refetchMetrics,
    refetchMonthlyData,
    refetchRankings,
    refetchAll: () => {
      refetchMetrics();
      refetchMonthlyData();
      refetchRankings();
    }
  };
};
