
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { formatCurrency } from '@/utils/currency';

export function CashFlowAnalysisWidget() {
  const { transactions } = useFinancialTransactions();

  // Agrupar transações por mês dos últimos 12 meses
  const monthlyData = React.useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      
      const monthTransactions = transactions.filter(t => 
        t.transaction_date.startsWith(monthKey)
      );
      
      const income = monthTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        netFlow: income - expenses
      });
    }
    
    return months;
  }, [transactions]);

  const totalNetFlow = monthlyData.reduce((sum, month) => sum + month.netFlow, 0);
  const averageNetFlow = totalNetFlow / monthlyData.length;

  return (
    <MinimalCard cols={2}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Análise de Fluxo de Caixa</h3>
          <TrendingUp className="h-5 w-5 text-gray-500" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Fluxo Total (12m)</p>
            <p className={`text-lg font-bold ${totalNetFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalNetFlow)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Média Mensal</p>
            <p className={`text-lg font-bold ${averageNetFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(averageNetFlow)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Tendência</p>
            <p className="text-lg font-bold text-blue-600">
              {monthlyData.length > 1 && monthlyData[monthlyData.length - 1].netFlow > monthlyData[monthlyData.length - 2].netFlow ? '↗' : '↘'}
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(Number(value)), name === 'income' ? 'Receitas' : name === 'expenses' ? 'Despesas' : 'Fluxo Líquido']}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="income" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="expenses" />
              <Line type="monotone" dataKey="netFlow" stroke="#3b82f6" strokeWidth={3} name="netFlow" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MinimalCard>
  );
}
