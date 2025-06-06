
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
            title="Receitas Totais"
            value={formatCurrency(metrics.totalRevenue)}
            subtitle="todas as receitas"
            icon={<DollarSign />}
            trend={metrics.revenueTrend}
          />
          
          <MetricWidget
            title="Despesas Totais"
            value={formatCurrency(metrics.totalExpenses)}
            subtitle="todas as despesas"
            icon={<TrendingUp />}
            trend={metrics.expensesTrend === 'up' ? 'down' : metrics.expensesTrend === 'down' ? 'up' : 'neutral'}
          />
          
          <MetricWidget
            title="Saldo Líquido"
            value={formatCurrency(metrics.netBalance)}
            subtitle="receitas - despesas"
            icon={<Target />}
            trend={metrics.netBalance >= 0 ? 'up' : 'down'}
            className="bg-gray-50 p-3 rounded-lg"
          />
        </div>
      </div>
    </MinimalCard>
  );
}
