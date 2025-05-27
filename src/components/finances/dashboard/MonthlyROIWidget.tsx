
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { MetricWidget } from './MetricWidget';
import { Target, Percent } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';

export function MonthlyROIWidget() {
  const metrics = useDashboardMetrics();

  return (
    <MinimalCard cols={2}>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">ROI Mensal</h3>
        
        <div className="space-y-4">
          <MetricWidget
            title="Sobre Valor Investido"
            value={`${metrics.roiOnInvestment.toFixed(2)}%`}
            subtitle="retorno mensal"
            icon={<Target />}
            trend="up"
            trendValue="+0.3%"
          />
          
          <MetricWidget
            title="Sobre Valor de Mercado"
            value={`${metrics.currentYield.toFixed(2)}%`}
            subtitle="yield atual"
            icon={<Percent />}
            trend="up"
            trendValue="+0.2%"
          />
        </div>
      </div>
    </MinimalCard>
  );
}
