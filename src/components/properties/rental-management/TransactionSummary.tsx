
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

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

  const getBalanceColor = () => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceIcon = () => {
    if (balance > 0) return <TrendingUp className="h-5 w-5" />;
    if (balance < 0) return <TrendingDown className="h-5 w-5" />;
    return <DollarSign className="h-5 w-5" />;
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <CardTitle className="text-center">Resumo do Mês</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {/* Total de Receitas */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Receitas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          {/* Total de Despesas */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              <span className="font-medium">Despesas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </p>
          </div>

          {/* Saldo */}
          <div className="space-y-2">
            <div className={`flex items-center justify-center gap-2 ${getBalanceColor()}`}>
              {getBalanceIcon()}
              <span className="font-medium">Saldo</span>
            </div>
            <p className={`text-2xl font-bold ${getBalanceColor()}`}>
              {formatCurrency(balance)}
            </p>
            {balance < 0 && (
              <p className="text-sm text-muted-foreground">
                (Déficit)
              </p>
            )}
          </div>
        </div>

        {/* Indicadores visuais */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Taxa de lucratividade:</span>
            <span className={totalIncome > 0 ? getBalanceColor() : 'text-gray-500'}>
              {totalIncome > 0 ? `${((balance / totalIncome) * 100).toFixed(1)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
