
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { formatCurrency } from '@/utils/currency';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export function ExpenseCategoryAnalysisWidget() {
  const { transactions } = useFinancialTransactions();
  const { categories } = useFinancialCategories();

  const expensesByCategory = React.useMemo(() => {
    const expenses = transactions.filter(t => t.transaction_type === 'expense');
    
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = categories.find(c => c.id === expense.category);
      const categoryName = category?.name || 'Outros';
      
      acc[categoryName] = (acc[categoryName] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

  return (
    <MinimalCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Despesas por Categoria</h3>
          <PieChartIcon className="h-5 w-5 text-gray-500" />
        </div>

        {expensesByCategory.length > 0 ? (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {expensesByCategory.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                    <span className="text-gray-500 ml-2">
                      ({((item.value / totalExpenses) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <PieChartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma despesa registrada</p>
          </div>
        )}
      </div>
    </MinimalCard>
  );
}
