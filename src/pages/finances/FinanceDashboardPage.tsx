
import React from 'react';
import { PropertyOccupancyWidget } from '@/components/finances/dashboard/PropertyOccupancyWidget';
import { PatrimonyWidget } from '@/components/finances/dashboard/PatrimonyWidget';
import { PropertyTypesChartWidget } from '@/components/finances/dashboard/PropertyTypesChartWidget';
import { FinancialPerformanceWidget } from '@/components/finances/dashboard/FinancialPerformanceWidget';
import { ROITypesWidget } from '@/components/finances/dashboard/ROITypesWidget';
import { MonthlyROIWidget } from '@/components/finances/dashboard/MonthlyROIWidget';

export default function FinanceDashboardPage() {
  return (
    <div className="container py-6">
      {/* Grid Layout - 6 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        
        {/* LINHA 1 */}
        <PropertyOccupancyWidget />
        <PatrimonyWidget />
        <PropertyTypesChartWidget />
        
        {/* LINHA 2 */}
        <FinancialPerformanceWidget />
        <ROITypesWidget />
        
        {/* LINHA 3 */}
        <MonthlyROIWidget />
        
        {/* Placeholder para Widget 7 - Valorização Patrimonial (4 colunas) */}
        <div className="col-span-1 md:col-span-3 lg:col-span-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h3 className="font-medium">Widget 7 - Valorização Patrimonial</h3>
            <p className="text-sm">Line Chart Interativo (4 colunas)</p>
          </div>
        </div>
        
        {/* LINHA 4 */}
        {/* Placeholder para Widget 8 - Top 5 Propriedades */}
        <div className="col-span-1 md:col-span-3 lg:col-span-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h3 className="font-medium">Widget 8 - Top 5 Propriedades</h3>
            <p className="text-sm">Lista rankeada (3 colunas)</p>
          </div>
        </div>
        
        {/* Placeholder para Widget 9 - Top Bairros */}
        <div className="col-span-1 md:col-span-3 lg:col-span-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h3 className="font-medium">Widget 9 - Top Bairros</h3>
            <p className="text-sm">Lista rankeada (3 colunas)</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
