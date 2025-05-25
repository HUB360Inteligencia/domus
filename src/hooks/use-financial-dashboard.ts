
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFinancialMetrics, fetchMonthlyFinancialData, fetchPropertyFinancialRanking } from '@/api/financial-dashboard';

export const useFinancialDashboard = () => {
  // State for UI controls
  const [showMarketValue, setShowMarketValue] = useState(true);
  const [propertyRankingType, setPropertyRankingType] = useState<'revenue' | 'roi'>('roi');
  const [neighborhoodRankingType, setNeighborhoodRankingType] = useState<'revenue' | 'count'>('revenue');
  const [chartViewMode, setChartViewMode] = useState<'patrimony' | 'roi'>('patrimony');

  // Fetch financial metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['financial-metrics'],
    queryFn: fetchFinancialMetrics,
  });

  // Fetch monthly data
  const { data: monthlyData = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['monthly-financial-data'],
    queryFn: () => fetchMonthlyFinancialData(12),
  });

  // Fetch property rankings
  const { data: propertyRankings = [], isLoading: isLoadingRankings } = useQuery({
    queryKey: ['property-financial-ranking'],
    queryFn: fetchPropertyFinancialRanking,
  });

  const isLoading = isLoadingMetrics || isLoadingMonthly || isLoadingRankings;

  // Transform data for components
  const assetValueData = metrics ? {
    totalMarketValue: metrics.totalMarketValue || 0,
    totalBookValue: metrics.totalBookValue || 0,
    totalAcquisitionValue: metrics.totalAcquisitionValue || 0,
  } : null;

  const performanceData = metrics ? {
    averageMonthlyReturn: metrics.averageMonthlyReturn || 0,
    previousMonthReturn: metrics.previousMonthReturn || 0,
    totalProperties: metrics.totalProperties || 0,
    occupancyRate: metrics.occupancyRate || 0,
  } : null;

  const topPropertiesData = propertyRankings.slice(0, 5);

  // Mock neighborhood data (would be calculated from properties)
  const neighborhoodData = [
    { name: 'Centro', revenue: 15000, count: 3, roi: 8.5 },
    { name: 'Vila Nova', revenue: 12000, count: 2, roi: 7.2 },
    { name: 'Jardim América', revenue: 10000, count: 2, roi: 6.8 },
    { name: 'Santa Rosa', revenue: 8000, count: 1, roi: 9.1 },
    { name: 'Copacabana', revenue: 7500, count: 1, roi: 5.5 },
  ];

  const assetGrowthData = monthlyData.map(item => ({
    month: item.month,
    marketValue: item.marketValue || 0,
    bookValue: item.bookValue || 0,
    acquisitionValue: item.acquisitionValue || 0,
  }));

  const roiByPropertyType = metrics?.roiByPropertyType || {};

  return {
    // Data
    assetValueData,
    performanceData,
    topPropertiesData,
    neighborhoodData,
    assetGrowthData,
    roiByPropertyType,
    
    // UI State
    showMarketValue,
    setShowMarketValue,
    propertyRankingType,
    setPropertyRankingType,
    neighborhoodRankingType,
    setNeighborhoodRankingType,
    chartViewMode,
    setChartViewMode,
    
    // Loading
    isLoading,
  };
};
