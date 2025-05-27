
import React from 'react';
import { PropertyOccupancyWidget } from '@/components/finances/dashboard/PropertyOccupancyWidget';
import { AssetValueWidget } from '@/components/dashboard/AssetValueWidget';
import { FinancialPerformanceWidget } from '@/components/dashboard/FinancialPerformanceWidget';
import { MonthlyROIWidget } from '@/components/finances/dashboard/MonthlyROIWidget';
import { AssetGrowthChartWidget } from '@/components/dashboard/AssetGrowthChartWidget';
import { TopPropertiesWidget } from '@/components/dashboard/TopPropertiesWidget';
import { TopNeighborhoodsWidget } from '@/components/dashboard/TopNeighborhoodsWidget';
import { ActivitiesWidget } from '@/components/dashboard/ActivitiesWidget';
import { PropertyTypesWidget } from '@/components/dashboard/PropertyTypesWidget';
import { PropertyROIWidget } from '@/components/dashboard/PropertyROIWidget';

export default function Dashboard() {
  return (
    <div className="container py-6">
      {/* Grid Layout responsivo - 3 widgets por linha em telas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* LINHA 1 - Propriedades, Patrimônio e Atividades (mesma altura e largura) */}
        <div className="md:col-span-1">
          <PropertyOccupancyWidget />
        </div>
        <div className="md:col-span-1">
          <AssetValueWidget />
        </div>
        <div className="md:col-span-1">
          <ActivitiesWidget />
        </div>
        
        {/* LINHA 2 - Performance Financeira menor, Tipos de Imóveis, ROI por Tipo, ROI Mensal */}
        <div className="md:col-span-1">
          <FinancialPerformanceWidget />
        </div>
        <div className="md:col-span-1 space-y-4">
          <div className="h-[calc(50%-0.5rem)]">
            <PropertyTypesWidget />
          </div>
          <div className="h-[calc(50%-0.5rem)]">
            <PropertyROIWidget />
          </div>
        </div>
        <div className="md:col-span-1">
          <MonthlyROIWidget />
        </div>
        
        {/* LINHA 3 - Top Propriedades, Top Bairros e Valorização Patrimonial */}
        <div className="md:col-span-1">
          <TopPropertiesWidget />
        </div>
        <div className="md:col-span-1">
          <TopNeighborhoodsWidget />
        </div>
        <div className="md:col-span-1">
          <AssetGrowthChartWidget />
        </div>
        
      </div>
    </div>
  );
}
