
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/types/property';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';

interface PropertyInvestmentOverviewProps {
  property: Property | null | undefined;
  blackAndWhite?: boolean;
}

export const PropertyInvestmentOverview: React.FC<PropertyInvestmentOverviewProps> = ({ 
  property,
  blackAndWhite = false 
}) => {
  const { investments, totalInvestment, isLoadingInvestments } = usePropertyInvestments(property?.id || null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate distribution by type
  const distributionByType = investments.reduce((acc, investment) => {
    const type = investment.investment_type;
    acc[type] = (acc[type] || 0) + investment.amount;
    return acc;
  }, {} as Record<string, number>);

  const typeLabels: Record<string, string> = {
    purchase: 'Compra',
    improvement: 'Melhorias',
    renovation: 'Reformas',
    maintenance: 'Manutenção',
    other: 'Outros'
  };

  const getCardStyle = (baseColor: string) => {
    if (blackAndWhite) {
      return 'border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white';
    }
    return `border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${baseColor}`;
  };

  const getIconColor = (baseColor: string) => {
    if (blackAndWhite) {
      return 'text-gray-600';
    }
    return baseColor;
  };

  if (isLoadingInvestments) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={getCardStyle('bg-white')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className={`h-4 w-4 ${getIconColor('text-blue-500')}`} />
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {investments.length} investimento{investments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className={getCardStyle('bg-white')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${getIconColor('text-green-500')}`} />
              Maior Investimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {investments.length > 0 
                ? formatCurrency(Math.max(...investments.map(i => i.amount)))
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {investments.length > 0 
                ? typeLabels[investments.find(i => i.amount === Math.max(...investments.map(inv => inv.amount)))?.investment_type || ''] || 'N/A'
                : 'Nenhum investimento'
              }
            </p>
          </CardContent>
        </Card>

        <Card className={getCardStyle('bg-white')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className={`h-4 w-4 ${getIconColor('text-purple-500')}`} />
              Tipo Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(distributionByType).length > 0 
                ? typeLabels[Object.entries(distributionByType).sort(([,a], [,b]) => b - a)[0]?.[0] || ''] || 'N/A'
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(distributionByType).length > 0 
                ? formatCurrency(Object.entries(distributionByType).sort(([,a], [,b]) => b - a)[0]?.[1] || 0)
                : 'Sem investimentos'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution by Type */}
      {Object.keys(distributionByType).length > 0 && (
        <Card className={getCardStyle('bg-white')}>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Tipo de Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributionByType)
                .sort(([,a], [,b]) => b - a)
                .map(([type, amount]) => {
                  const percentage = totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${blackAndWhite ? 'bg-gray-400' : 'bg-blue-500'}`} />
                        <span className="text-sm font-medium">{typeLabels[type] || type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(amount)}</div>
                        <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
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
