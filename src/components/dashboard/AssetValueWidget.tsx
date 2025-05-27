
import React from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { MetricWidget } from '@/components/finances/dashboard/MetricWidget';
import { TrendingUp, DollarSign } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { formatCurrency } from '@/utils/currency';

export function AssetValueWidget() {
  const metrics = useDashboardMetrics();

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Patrimônio</h3>
        
        <div className="flex-1 space-y-6">
          <MetricWidget
            title="Valor de Compra"
            value={formatCurrency(metrics.totalPurchaseValue)}
            subtitle="investimento total"
            icon={<DollarSign />}
            className="pb-4 border-b border-gray-100"
          />
          
          <MetricWidget
            title="Valor de Mercado"
            value={formatCurrency(metrics.totalMarketValue)}
            subtitle="valor atual"
            icon={<TrendingUp />}
            trend={metrics.assetGrowthPercentage >= 0 ? 'up' : 'down'}
            trendValue={`${metrics.assetGrowthPercentage >= 0 ? '+' : ''}${metrics.assetGrowthPercentage.toFixed(1)}%`}
          />
        </div>
      </div>
    </MinimalCard>
  );
}
