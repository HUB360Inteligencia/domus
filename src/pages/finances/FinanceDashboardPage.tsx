
import React from 'react';
import { PropertyOccupancyWidget } from '@/components/finances/dashboard/PropertyOccupancyWidget';
import { PatrimonyWidget } from '@/components/finances/dashboard/PatrimonyWidget';
import { MonthlyROIWidget } from '@/components/finances/dashboard/MonthlyROIWidget';
import { CashFlowAnalysisWidget } from '@/components/finances/dashboard/CashFlowAnalysisWidget';
import { PropertyProfitabilityWidget } from '@/components/finances/dashboard/PropertyProfitabilityWidget';
import { ExpenseCategoryAnalysisWidget } from '@/components/finances/dashboard/ExpenseCategoryAnalysisWidget';
import { ROITypesWidget } from '@/components/finances/dashboard/ROITypesWidget';
import { PropertyFilters } from '@/components/finances/dashboard/PropertyFilters';
import { PropertyAnalyticsTable } from '@/components/finances/dashboard/PropertyAnalyticsTable';
import { PropertyAnalyticsSummary } from '@/components/finances/dashboard/PropertyAnalyticsSummary';
import { usePropertyAnalytics } from '@/hooks/use-property-analytics';
import { PropertyAnalyticsData } from '@/api/property-analytics';

export default function FinanceDashboardPage() {
  const {
    analyticsData,
    filterOptions,
    filters,
    summary,
    isLoading,
    updateFilters,
    clearFilters
  } = usePropertyAnalytics();

  const handlePropertyClick = (property: PropertyAnalyticsData) => {
    // TODO: Implementar modal de detalhes da propriedade (Fase 3)
    console.log('Clicked property:', property);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
        <p className="text-gray-600">Análises avançadas e insights financeiros detalhados</p>
      </div>

      {/* Grid Layout - Dashboard Analítico */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        
        {/* LINHA 1 - KPIs Principais */}
        <PropertyOccupancyWidget />
        <PatrimonyWidget />
        <MonthlyROIWidget />
        
        {/* LINHA 2 - Análise de Fluxo de Caixa (ocupa 4 colunas) */}
        <CashFlowAnalysisWidget />
        
        {/* LINHA 2 - Análise de Despesas por Categoria (2 colunas) */}
        <ExpenseCategoryAnalysisWidget />
        
        {/* LINHA 3 - Rentabilidade por Propriedade (4 colunas) */}
        <PropertyProfitabilityWidget />
        
        {/* LINHA 3 - ROI por Tipos (2 colunas) */}
        <ROITypesWidget />
        
      </div>

      {/* Nova Seção - Análise Detalhada de Propriedades */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Análise de Propriedades</h2>
          
          {/* Filtros */}
          <PropertyFilters
            filters={filters}
            filterOptions={filterOptions}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
          />
          
          {/* Resumo Estatístico */}
          <PropertyAnalyticsSummary
            summary={summary}
            isLoading={isLoading}
          />
          
          {/* Tabela Principal */}
          <PropertyAnalyticsTable
            data={analyticsData}
            isLoading={isLoading}
            onPropertyClick={handlePropertyClick}
          />
        </div>
      </div>
    </div>
  );
}
