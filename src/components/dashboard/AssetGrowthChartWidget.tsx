
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { RevenueExpenseChart } from '@/components/dashboard/RevenueExpenseChart';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';

export function AssetGrowthChartWidget() {
  const [viewMode, setViewMode] = useState('patrimony');
  const { transactions, isLoadingTransactions } = useFinancialTransactions();

  const viewOptions = [
    { value: 'patrimony', label: 'Patrimônio' },
    { value: 'cashflow', label: 'Fluxo de Caixa' }
  ];

  return (
    <MinimalCard cols={4}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Valorização Patrimonial</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={setViewMode}
            options={viewOptions}
          />
        </div>
        
        <div className="h-64">
          <RevenueExpenseChart transactions={transactions} isLoading={isLoadingTransactions} />
        </div>
      </div>
    </MinimalCard>
  );
}
