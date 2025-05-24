
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { Property } from '@/types/property';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';

interface PropertyInvestmentOverviewProps {
  property: Property | null | undefined;
}

export const PropertyInvestmentOverview = ({ property }: PropertyInvestmentOverviewProps) => {
  const {
    investments,
    totalInvestment,
    isLoadingInvestments,
  } = usePropertyInvestments(property?.id || null);

  if (isLoadingInvestments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!property) {
    return null;
  }

  // Calculate metrics
  const purchaseValue = property.purchase_value || 0;
  const additionalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPropertyInvestment = purchaseValue + additionalInvestments;
  const currentValue = property.value || 0;
  const totalGain = currentValue - totalPropertyInvestment;
  const roiPercentage = totalPropertyInvestment > 0 ? (totalGain / totalPropertyInvestment) * 100 : 0;

  // Investment breakdown by type
  const investmentsByType = investments.reduce((acc, inv) => {
    acc[inv.investment_type] = (acc[inv.investment_type] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const investmentTypeLabels: Record<string, string> = {
    purchase: 'Compra',
    improvement: 'Melhorias',
    renovation: 'Reformas',
    maintenance: 'Manutenção',
    other: 'Outros'
  };

  return (
    <div className="space-y-6">
      {/* Main Investment Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumo dos Investimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Valor de Compra</span>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {formatCurrency(purchaseValue)}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Investimentos Adicionais</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {formatCurrency(additionalInvestments)}
              </div>
              <div className="text-xs text-green-700 mt-1">
                {investments.length} investimento{investments.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Total Investido</span>
              </div>
              <div className="text-lg font-bold text-purple-900">
                {formatCurrency(totalPropertyInvestment)}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${roiPercentage >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {roiPercentage >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${roiPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ROI Atual
                </span>
              </div>
              <div className={`text-lg font-bold ${roiPercentage >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                {roiPercentage.toFixed(2)}%
              </div>
              <div className={`text-xs mt-1 ${roiPercentage >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(totalGain)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Breakdown */}
      {Object.keys(investmentsByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(investmentsByType).map(([type, amount]) => {
                const percentage = totalPropertyInvestment > 0 ? (amount / totalPropertyInvestment) * 100 : 0;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {investmentTypeLabels[type] || type}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(amount)}</div>
                        <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
