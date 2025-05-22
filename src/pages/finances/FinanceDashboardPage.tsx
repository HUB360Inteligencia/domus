
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useFinancialDashboard } from '@/hooks/use-financial-dashboard';
import { FinancialStatsSection } from '@/components/finances/dashboard/FinancialStatsSection';
import { FinancialChartsSection } from '@/components/finances/dashboard/FinancialChartsSection';
import { FinancialRankingsSection } from '@/components/finances/dashboard/FinancialRankingsSection';

export default function FinanceDashboardPage() {
  // Use our custom hook to get all the data and state
  const {
    assetValueData,
    performanceData,
    topPropertiesData,
    neighborhoodData,
    assetGrowthData,
    roiByPropertyType,
    
    showMarketValue,
    setShowMarketValue,
    propertyRankingType,
    setPropertyRankingType,
    neighborhoodRankingType,
    setNeighborhoodRankingType,
    chartViewMode,
    setChartViewMode,
    
    isLoading
  } = useFinancialDashboard();

  return (
    <div className="container py-6">
      <PageHeader 
        title="Painel Financeiro" 
        description="Visão geral do seu patrimônio e rendimentos"
      />
      
      {/* KPI Cards */}
      <FinancialStatsSection 
        assetValueData={assetValueData}
        performanceData={performanceData}
        showMarketValue={showMarketValue}
        setShowMarketValue={setShowMarketValue}
        isLoading={isLoading}
      />

      {/* Charts Section */}
      <FinancialChartsSection 
        assetGrowthData={assetGrowthData}
        roiByPropertyType={roiByPropertyType}
        chartViewMode={chartViewMode}
        setChartViewMode={setChartViewMode}
        isLoading={isLoading}
      />

      {/* Rankings Section */}
      <FinancialRankingsSection 
        topPropertiesData={topPropertiesData}
        neighborhoodData={neighborhoodData}
        propertyRankingType={propertyRankingType}
        setPropertyRankingType={setPropertyRankingType}
        neighborhoodRankingType={neighborhoodRankingType}
        setNeighborhoodRankingType={setNeighborhoodRankingType}
        isLoading={isLoading}
      />
    </div>
  );
}
