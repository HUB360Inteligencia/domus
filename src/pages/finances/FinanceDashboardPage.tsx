
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useFinancialDashboard } from '@/hooks/use-financial-dashboard';
import { StatsCards } from '@/components/finances/StatsCards';
import { PatrimonyValueChart } from '@/components/finances/PatrimonyValueChart';
import { PropertyRoiChart } from '@/components/finances/PropertyRoiChart';
import { RankingCard } from '@/components/finances/RankingCard';

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
      
      {/* KPI Cards - Now in one row on large screens */}
      <div className="mb-6">
        <StatsCards
          assetValueData={assetValueData}
          performanceData={performanceData}
          showMarketValue={showMarketValue}
          setShowMarketValue={setShowMarketValue}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Valorização Patrimonial Chart */}
        <div className="lg:col-span-2">
          <PatrimonyValueChart 
            data={assetGrowthData}
            viewMode={chartViewMode}
            onViewModeChange={setChartViewMode}
            isLoading={isLoading}
          />
        </div>

        {/* ROI by Property Type Chart */}
        <div className="lg:col-span-1">
          <PropertyRoiChart 
            data={roiByPropertyType}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Rankings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Properties Ranking */}
        <RankingCard
          title="Top 5 Propriedades"
          description="Propriedades com maior rentabilidade"
          items={topPropertiesData}
          rankingType={propertyRankingType}
          onRankingTypeChange={setPropertyRankingType}
          itemType="property"
          isLoading={isLoading}
        />

        {/* Neighborhood Ranking */}
        <RankingCard
          title="Rentabilidade por Bairro"
          description="Bairros com melhor desempenho"
          items={neighborhoodData}
          rankingType={neighborhoodRankingType}
          onRankingTypeChange={setNeighborhoodRankingType}
          itemType="neighborhood"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
