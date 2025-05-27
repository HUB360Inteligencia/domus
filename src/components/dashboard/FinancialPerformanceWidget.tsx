
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { MetricWidget } from '@/components/finances/dashboard/MetricWidget';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { DollarSign, TrendingUp, Target } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { formatCurrency } from '@/utils/currency';

export function FinancialPerformanceWidget() {
  const [period, setPeriod] = useState('month');
  const metrics = useDashboardMetrics();

  const periodOptions = [
    { value: 'month', label: 'Mês' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Ano' }
  ];

  return (
    <MinimalCard cols={3}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Performance Financeira</h3>
          <SimpleToggle 
            value={period}
            onValueChange={setPeriod}
            options={periodOptions}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <MetricWidget
            title="Receitas"
            value={formatCurrency(metrics.monthlyRevenue)}
            subtitle="do período"
            icon={<DollarSign />}
            trend={metrics.revenueTrend}
            trendValue={metrics.revenueTrend !== 'neutral' ? '+12%' : '0%'}
          />
          
          <MetricWidget
            title="Despesas"
            value={formatCurrency(metrics.monthlyExpenses)}
            subtitle="do período"
            icon={<DollarSign />}
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
