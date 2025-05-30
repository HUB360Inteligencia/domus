
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TransactionSummaryProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  totalIncome,
  totalExpense,
  balance
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-0 bg-gray-50">
      <CardContent className="p-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Total Receitas</div>
            <div className="text-sm font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Despesas</div>
            <div className="text-sm font-semibold text-red-600">
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Saldo Final</div>
            <div className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
