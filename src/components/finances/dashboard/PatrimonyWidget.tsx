
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { MetricWidget } from './MetricWidget';
import { TrendingUp, DollarSign } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { formatCurrency } from '@/utils/currency';

export function PatrimonyWidget() {
  const metrics = useDashboardMetrics();

  const growth = metrics.totalMarketValue - metrics.totalPurchaseValue;
  const growthPercentage = metrics.assetGrowthPercentage;

  return (
    <MinimalCard cols={2}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Patrimônio</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          <MetricWidget
            title="Valor de Compra"
            value={formatCurrency(metrics.totalPurchaseValue)}
            subtitle="investimento total"
            icon={<DollarSign />}
          />
          
          <MetricWidget
            title="Valor de Mercado"
            value={formatCurrency(metrics.totalMarketValue)}
            subtitle="valor atual"
            icon={<TrendingUp />}
          />
          
          <MetricWidget
            title="Crescimento"
            value={`${growthPercentage.toFixed(1)}%`}
            subtitle={formatCurrency(growth)}
            trend={growth >= 0 ? 'up' : 'down'}
            trendValue={`${growth >= 0 ? '+' : ''}${formatCurrency(growth)}`}
          />
        </div>
      </div>
    </MinimalCard>
  );
}
