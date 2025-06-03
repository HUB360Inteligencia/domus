
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
import { ROIByPropertyTypeWidget } from '@/components/dashboard/ROIByPropertyTypeWidget';

export default function Dashboard() {
  return (
    <div className="container py-6">
      {/* Grid Layout responsivo - nova estrutura em 4 linhas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* LINHA 1 - Propriedades, Patrimônio e ROI Mensal (3 colunas iguais) */}
        <div className="md:col-span-1">
          <PropertyOccupancyWidget />
        </div>
        <div className="md:col-span-1">
          <AssetValueWidget />
        </div>
        <div className="md:col-span-1">
          <MonthlyROIWidget />
        </div>
        
        {/* LINHA 2 - Performance Financeira (1 col) e Atividades (2 cols) */}
        <div className="md:col-span-1">
          <FinancialPerformanceWidget />
        </div>
        <div className="md:col-span-2">
          <ActivitiesWidget />
        </div>
        
        {/* LINHA 3 - Tipos de Imóveis (1 col) e Valorização Patrimonial (2 cols) */}
        <div className="md:col-span-1">
          <PropertyTypesWidget />
        </div>
        <div className="md:col-span-2">
          <AssetGrowthChartWidget />
        </div>
        
        {/* LINHA 4 - Top Propriedades, Top Bairros e ROI por Tipo (3 colunas iguais) */}
        <div className="md:col-span-1">
          <TopPropertiesWidget />
        </div>
        <div className="md:col-span-1">
          <TopNeighborhoodsWidget />
        </div>
        <div className="md:col-span-1">
          <ROIByPropertyTypeWidget />
        </div>
        
      </div>
    </div>
  );
}
