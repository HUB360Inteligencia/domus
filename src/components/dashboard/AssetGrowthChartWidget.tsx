
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { PatrimonyChart } from '@/components/dashboard/PatrimonyChart';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';

export function AssetGrowthChartWidget() {
  const [viewMode, setViewMode] = useState<'patrimony' | 'cashflow'>('patrimony');
  const metrics = useDashboardMetrics();

  const viewOptions = [
    { value: 'patrimony', label: 'Patrimônio' },
    { value: 'cashflow', label: 'Fluxo de Caixa' }
  ];

  // Simular dados históricos para demonstração
  const chartData = [
    { month: 'Jan', marketValue: metrics.totalMarketValue * 0.85, acquisitionValue: metrics.totalPurchaseValue },
    { month: 'Fev', marketValue: metrics.totalMarketValue * 0.88, acquisitionValue: metrics.totalPurchaseValue },
    { month: 'Mar', marketValue: metrics.totalMarketValue * 0.92, acquisitionValue: metrics.totalPurchaseValue },
    { month: 'Abr', marketValue: metrics.totalMarketValue * 0.95, acquisitionValue: metrics.totalPurchaseValue },
    { month: 'Mai', marketValue: metrics.totalMarketValue * 0.98, acquisitionValue: metrics.totalPurchaseValue },
    { month: 'Jun', marketValue: metrics.totalMarketValue, acquisitionValue: metrics.totalPurchaseValue }
  ];

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Valorização Patrimonial</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'patrimony' | 'cashflow')}
            options={viewOptions}
          />
        </div>
        
        <div className="flex-1 min-h-0">
          <PatrimonyChart 
            data={chartData}
            viewMode={viewMode}
            isLoading={false}
          />
        </div>
      </div>
    </MinimalCard>
  );
}
