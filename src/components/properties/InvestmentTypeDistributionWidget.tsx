
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Skeleton } from '@/components/ui/skeleton';

interface InvestmentTypeDistributionWidgetProps {
  propertyId: string | null;
}

export const InvestmentTypeDistributionWidget: React.FC<InvestmentTypeDistributionWidgetProps> = ({
  propertyId
}) => {
  const { investments, isLoading } = usePropertyInvestments(propertyId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Mapear tipos de investimento para português
  const investmentTypeLabels: Record<string, string> = {
    'purchase': 'Aquisição',
    'improvement': 'Benfeitorias',
    'renovation': 'Reformas',
    'maintenance': 'Manutenção',
    'legal': 'Documentação',
    'other': 'Outros'
  };

  // Calcular distribuição por tipo
  const distributionData = React.useMemo(() => {
    if (!investments || investments.length === 0) return [];
    
    const typeAmounts = investments.reduce((acc, investment) => {
      const type = investment.investment_type || 'other';
      const label = investmentTypeLabels[type] || 'Outros';
      acc[label] = (acc[label] || 0) + investment.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(typeAmounts).reduce((sum, amount) => sum + amount, 0);
    
    const colors = ['#0A5B6C', '#0E7A8A', '#1299A8', '#16B8C6', '#1AD7E4', '#5EE4F1'];
    
    return Object.entries(typeAmounts)
      .map(([type, amount], index) => ({
        type,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [investments]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Tipo de Investimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Distribuição por Tipo de Investimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {distributionData.length > 0 ? (
          distributionData.map((item, index) => (
            <div key={item.type} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  <span className="text-gray-500">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="ml-7">
                <Progress 
                  value={item.percentage} 
                  className="h-2"
                  style={{
                    '--progress-foreground': item.color
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-sm">Nenhum investimento cadastrado</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
