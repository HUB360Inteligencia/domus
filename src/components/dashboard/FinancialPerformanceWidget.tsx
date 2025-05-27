
import React from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { MetricWidget } from '@/components/finances/dashboard/MetricWidget';
import { DollarSign, TrendingUp, Target } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { formatCurrency } from '@/utils/currency';

export function FinancialPerformanceWidget() {
  const metrics = useDashboardMetrics();

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Financeira</h3>
        
        <div className="flex-1 space-y-4">
          <MetricWidget
            title="Receitas"
            value={formatCurrency(metrics.monthlyRevenue)}
            subtitle="mês atual"
            icon={<DollarSign />}
            trend={metrics.revenueTrend}
            trendValue={metrics.revenueTrend !== 'neutral' ? '+12%' : '0%'}
          />
          
          <MetricWidget
            title="Despesas"
            value={formatCurrency(metrics.monthlyExpenses)}
            subtitle="mês atual"
            icon={<TrendingUp />}
            trend={metrics.expensesTrend === 'up' ? 'down' : metrics.expensesTrend === 'down' ? 'up' : 'neutral'}
            trendValue={metrics.expensesTrend !== 'neutral' ? '-5%' : '0%'}
          />
          
          <MetricWidget
            title="Lucro Líquido"
            value={formatCurrency(metrics.monthlyProfit)}
            subtitle="receitas - despesas"
            icon={<Target />}
            trend={metrics.profitTrend}
            trendValue={metrics.profitTrend !== 'neutral' ? '+18%' : '0%'}
          />
        </div>
      </div>
    </MinimalCard>
  );
}
