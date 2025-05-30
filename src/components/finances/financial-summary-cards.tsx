
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
    <div className="space-y-3">
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as any)}
          className="bg-muted p-1 rounded-md"
        >
          <ToggleGroupItem value="monthly" className="text-xs px-2 py-1">
            Mês Anterior
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="text-xs px-2 py-1">
            Ano Corrente
          </ToggleGroupItem>
          <ToggleGroupItem value="last12months" className="text-xs px-2 py-1">
            Últimos 12 Meses
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Receitas Card - White background, black text */}
        <Card className="border border-green-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-black">
              Receitas - {getViewModeLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-black">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        {/* Despesas Card - White background, black text */}
        <Card className="border border-red-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-black">
              Despesas - {getViewModeLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-black">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        {/* Saldo Card - Black background, white text */}
        <Card className="border border-gray-800 bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white">
              Saldo - {getViewModeLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-white">
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
