
import React, { useState } from 'react';
import { MinimalCard } from './MinimalCard';
import { MetricWidget } from './MetricWidget';
import { SimpleToggle } from './SimpleToggle';
import { DollarSign, TrendingUp, Target } from 'lucide-react';
import { useFinancialSummary } from '@/hooks/use-financial-summary';
import { formatCurrency } from '@/utils/currency';

const periodOptions = [
  { value: 'lastMonth', label: 'Mês Passado' },
  { value: 'currentMonth', label: 'Mês Vigente' },
  { value: 'currentYear', label: 'Ano Corrente' },
  { value: 'last12Months', label: 'Últimos 12 Meses' }
];

export function FinancialPerformanceWidget() {
  const [selectedPeriod, setSelectedPeriod] = useState('currentMonth');
  const { data, isLoading } = useFinancialSummary(selectedPeriod);

  if (isLoading || !data) {
    return (
      <MinimalCard cols={3}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </MinimalCard>
    );
  }

  return (
    <MinimalCard cols={3}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Performance Financeira</h3>
          <SimpleToggle
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            options={periodOptions}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <MetricWidget
            title="Receitas"
            value={formatCurrency(data.totalIncome)}
            icon={<DollarSign />}
            trend="up"
            trendValue="+5.2%"
          />
          
          <MetricWidget
            title="Despesas"
            value={formatCurrency(data.totalExpenses)}
            icon={<TrendingUp />}
            trend="down"
            trendValue="-2.1%"
          />
          
          <MetricWidget
            title="Lucro Líquido"
            value={formatCurrency(data.balance)}
            icon={<Target />}
            trend={data.balance >= 0 ? 'up' : 'down'}
            trendValue={data.balance >= 0 ? '+8.3%' : '-3.2%'}
          />
        </div>
      </div>
    </MinimalCard>
  );
}
