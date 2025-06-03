
import React from 'react';
import { PropertyOccupancyWidget } from '@/components/finances/dashboard/PropertyOccupancyWidget';
import { PatrimonyWidget } from '@/components/finances/dashboard/PatrimonyWidget';
import { MonthlyROIWidget } from '@/components/finances/dashboard/MonthlyROIWidget';
import { CashFlowAnalysisWidget } from '@/components/finances/dashboard/CashFlowAnalysisWidget';
import { PropertyProfitabilityWidget } from '@/components/finances/dashboard/PropertyProfitabilityWidget';
import { ExpenseCategoryAnalysisWidget } from '@/components/finances/dashboard/ExpenseCategoryAnalysisWidget';
import { ROITypesWidget } from '@/components/finances/dashboard/ROITypesWidget';

export default function FinanceDashboardPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
        <p className="text-gray-600">Análises avançadas e insights financeiros detalhados</p>
      </div>

      {/* Grid Layout - Dashboard Analítico */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        
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
    </div>
  );
}
