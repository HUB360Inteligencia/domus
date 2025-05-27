
import React from 'react';
import { PropertyOccupancyWidget } from '@/components/finances/dashboard/PropertyOccupancyWidget';
import { AssetValueWidget } from '@/components/dashboard/AssetValueWidget';
import { PropertyTypesROIWidget } from '@/components/dashboard/PropertyTypesROIWidget';
import { FinancialPerformanceWidget } from '@/components/dashboard/FinancialPerformanceWidget';
import { MonthlyROIWidget } from '@/components/finances/dashboard/MonthlyROIWidget';
import { AssetGrowthChartWidget } from '@/components/dashboard/AssetGrowthChartWidget';
import { TopPropertiesWidget } from '@/components/dashboard/TopPropertiesWidget';
import { TopNeighborhoodsWidget } from '@/components/dashboard/TopNeighborhoodsWidget';
import { ActivitiesWidget } from '@/components/dashboard/ActivitiesWidget';

export default function Dashboard() {
  return (
    <div className="container py-6">
      {/* Grid Layout - Responsivo: 1 coluna no mobile, 3 no tablet, 6 no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
        
        {/* LINHA 1 - Cards principais */}
        <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
          <PropertyOccupancyWidget />
        </div>
        <div className="sm:col-span-2 md:col-span-2 lg:col-span-2">
          <AssetValueWidget />
        </div>
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <ActivitiesWidget />
        </div>
        
        {/* LINHA 2 - Performance e ROI */}
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <FinancialPerformanceWidget />
        </div>
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <PropertyTypesROIWidget />
        </div>
        
        {/* LINHA 3 - ROI Mensal e Valorização */}
        <div className="sm:col-span-2 md:col-span-2 lg:col-span-2">
          <MonthlyROIWidget />
        </div>
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
          <AssetGrowthChartWidget />
        </div>
        
        {/* LINHA 4 - Rankings */}
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <TopPropertiesWidget />
        </div>
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <TopNeighborhoodsWidget />
        </div>
        
      </div>
    </div>
  );
}
