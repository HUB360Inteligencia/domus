
import React from 'react';
import { PropertyOccupancyWidget } from '@/components/finances/dashboard/PropertyOccupancyWidget';
import { AssetValueWidget } from '@/components/dashboard/AssetValueWidget';
import { PropertyTypesChartWidget } from '@/components/finances/dashboard/PropertyTypesChartWidget';
import { FinancialPerformanceWidget } from '@/components/dashboard/FinancialPerformanceWidget';
import { ROIByTypeWidget } from '@/components/dashboard/ROIByTypeWidget';
import { MonthlyROIWidget } from '@/components/finances/dashboard/MonthlyROIWidget';
import { AssetGrowthChartWidget } from '@/components/dashboard/AssetGrowthChartWidget';
import { TopPropertiesWidget } from '@/components/dashboard/TopPropertiesWidget';
import { TopNeighborhoodsWidget } from '@/components/dashboard/TopNeighborhoodsWidget';

export default function Dashboard() {
  return (
    <div className="container py-6">
      {/* Grid Layout - 6 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        
        {/* LINHA 1 */}
        <PropertyOccupancyWidget />
        <AssetValueWidget />
        <PropertyTypesChartWidget />
        
        {/* LINHA 2 */}
        <FinancialPerformanceWidget />
        <ROIByTypeWidget />
        
        {/* LINHA 3 */}
        <MonthlyROIWidget />
        <AssetGrowthChartWidget />
        
        {/* LINHA 4 */}
        <TopPropertiesWidget />
        <TopNeighborhoodsWidget />
        
      </div>
    </div>
  );
}
