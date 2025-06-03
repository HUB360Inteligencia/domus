
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { MetricWidget } from './MetricWidget';
import { Target, Percent, TrendingUp } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';

export function MonthlyROIWidget() {
  const metrics = useDashboardMetrics();

  const trendIcon = metrics.monthlyROI.trend === 'up' ? 'up' : 
                   metrics.monthlyROI.trend === 'down' ? 'down' : 'neutral';
  
  const trendValue = metrics.monthlyROI.lastMonth > metrics.monthlyROI.average12Months 
    ? `+${(metrics.monthlyROI.lastMonth - metrics.monthlyROI.average12Months).toFixed(2)}%`
    : metrics.monthlyROI.lastMonth < metrics.monthlyROI.average12Months
    ? `${(metrics.monthlyROI.lastMonth - metrics.monthlyROI.average12Months).toFixed(2)}%`
    : '0%';

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI Mensal</h3>
        
        <div className="flex-1 space-y-6">
          <MetricWidget
            title="Último Mês (Valor Investido)"
            value={`${metrics.monthlyROI.onInvestment.toFixed(2)}%`}
            subtitle="retorno sobre investimento"
            icon={<Target />}
            trend={trendIcon}
            trendValue={trendValue}
          />
          
          <MetricWidget
            title="Último Mês (Valor de Mercado)"
            value={`${metrics.monthlyROI.onMarketValue.toFixed(2)}%`}
            subtitle="yield atual"
            icon={<Percent />}
            trend={trendIcon}
            trendValue={trendValue}
          />

          <MetricWidget
            title="Média 12 Meses"
            value={`${metrics.monthlyROI.average12Months.toFixed(2)}%`}
            subtitle="média anual"
            icon={<TrendingUp />}
            className="pb-4 border-t border-gray-100 pt-4"
          />
        </div>
      </div>
    </MinimalCard>
  );
}
