
import React, { useState } from 'react';
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
import { PropertyDetailModal } from '@/components/finances/dashboard/PropertyDetailModal';
import { usePropertyAnalytics } from '@/hooks/use-property-analytics';
import { PropertyAnalyticsData } from '@/api/property-analytics';

export default function FinanceDashboardPage() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyAnalyticsData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
        <p className="text-gray-600">Análises avançadas e insights financeiros detalhados</p>
      </div>

      {/* Grid Layout - Dashboard Analítico */}
      

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
          <PropertyAnalyticsSummary summary={summary} isLoading={isLoading} />
          
          {/* Tabela Principal */}
          <PropertyAnalyticsTable 
            data={analyticsData} 
            isLoading={isLoading} 
            onPropertyClick={handlePropertyClick} 
          />
        </div>
      </div>

      {/* Modal Detalhado */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
