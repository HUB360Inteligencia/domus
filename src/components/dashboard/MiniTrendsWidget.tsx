
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { formatCurrency } from '@/utils/currency';

export function MiniTrendsWidget() {
  const { transactions } = useFinancialTransactions();

  // Calcular dados financeiros anuais
  const annualFinancialData = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getFullYear() === currentYear;
    });

    const totalRevenue = yearTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = yearTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalRevenue - totalExpenses;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      balance
    };
  }, [transactions]);

  const trends = [
    {
      label: 'Receitas Anuais',
      value: formatCurrency(annualFinancialData.revenue),
      description: `${new Date().getFullYear()}`
    },
    {
      label: 'Despesas Anuais',
      value: formatCurrency(annualFinancialData.expenses),
      description: `${new Date().getFullYear()}`
    },
    {
      label: 'Saldo Anual',
      value: formatCurrency(annualFinancialData.balance),
      description: annualFinancialData.balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'
    }
  ];

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow bg-gray-25 border-gray-100 h-48">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Resultado Financeiro Anual</h3>
        
        <div className="space-y-4">
          {trends.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
