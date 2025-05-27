
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency } from '@/utils/currency';

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  viewMode: 'monthly' | 'yearly' | 'last12months';
  onViewModeChange: (mode: 'monthly' | 'yearly' | 'last12months') => void;
}

export function FinancialSummaryCards({
  totalIncome,
  totalExpenses,
  balance,
  viewMode,
  onViewModeChange
}: FinancialSummaryCardsProps) {
  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'monthly':
        return 'Mês Anterior';
      case 'yearly':
        return 'Ano Corrente';
      case 'last12months':
        return 'Últimos 12 Meses';
      default:
        return 'Período';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as any)}
          className="bg-muted p-1 rounded-md"
        >
          <ToggleGroupItem value="monthly" className="text-sm">
            Mês Anterior
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="text-sm">
            Ano Corrente
          </ToggleGroupItem>
          <ToggleGroupItem value="last12months" className="text-sm">
            Últimos 12 Meses
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas - {getViewModeLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas - {getViewModeLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${balance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo - {getViewModeLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
