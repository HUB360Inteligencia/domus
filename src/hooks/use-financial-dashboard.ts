
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFinancialMetrics, fetchMonthlyFinancialData, fetchPropertyFinancialRanking } from '@/api/financial-dashboard';
import { fetchNeighborhoodFinancialData } from '@/api/neighborhood-financial-data';
import { PropertyRankingItem } from '@/types/financial-ranking';

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

  // Fetch neighborhood data
  const { data: neighborhoodRankings = [], isLoading: isLoadingNeighborhoods } = useQuery({
    queryKey: ['neighborhood-financial-data'],
    queryFn: fetchNeighborhoodFinancialData,
  });

  const isLoading = isLoadingMetrics || isLoadingMonthly || isLoadingRankings || isLoadingNeighborhoods;

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

  // Transform PropertyFinancialRanking to PropertyRankingItem with proper fallbacks
  const topPropertiesData: PropertyRankingItem[] = propertyRankings.slice(0, 5).map((item) => ({
    id: item.id || item.propertyId,
    name: item.name || item.propertyTitle,
    type: item.type || 'Residencial',
    location: item.location || item.neighborhood || 'Não informado',
    return: item.revenue,
    percentage: item.roi,
  }));

  // Use real neighborhood data instead of mock data
  const neighborhoodData = neighborhoodRankings.map(item => ({
    name: item.name,
    revenue: item.revenue,
    count: item.count,
    roi: item.roi,
  }));

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
