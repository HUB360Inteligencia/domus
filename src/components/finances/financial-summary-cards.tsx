
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">Resumo Financeiro</h4>
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && onViewModeChange(value as 'monthly' | 'yearly' | 'last12months')}
          className="border rounded-lg p-1"
        >
          <ToggleGroupItem value="monthly" className="text-xs px-3 py-1">
            Mês Anterior
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="text-xs px-3 py-1">
            Ano Corrente
          </ToggleGroupItem>
          <ToggleGroupItem value="last12months" className="text-xs px-3 py-1">
            Últimos 12 Meses
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Income Card */}
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(balance))}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
