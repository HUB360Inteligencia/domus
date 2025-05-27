
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
      {/* Grid Layout otimizado - sem gaps desnecessários */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LINHA 1 - Propriedades, Patrimônio e Atividades (mesma altura e largura) */}
        <div className="lg:col-span-4">
          <PropertyOccupancyWidget />
        </div>
        <div className="lg:col-span-4">
          <AssetValueWidget />
        </div>
        <div className="lg:col-span-4">
          <ActivitiesWidget />
        </div>
        
        {/* LINHA 2 - Performance Financeira, Tipos & ROI e ROI Mensal (mesmas proporções) */}
        <div className="lg:col-span-4">
          <FinancialPerformanceWidget />
        </div>
        <div className="lg:col-span-4">
          <PropertyTypesROIWidget />
        </div>
        <div className="lg:col-span-4">
          <MonthlyROIWidget />
        </div>
        
        {/* LINHA 3 - Top Propriedades, Top Bairros e Valorização Patrimonial */}
        <div className="lg:col-span-4">
          <TopPropertiesWidget />
        </div>
        <div className="lg:col-span-4">
          <TopNeighborhoodsWidget />
        </div>
        <div className="lg:col-span-4">
          <AssetGrowthChartWidget />
        </div>
        
      </div>
    </div>
  );
}
