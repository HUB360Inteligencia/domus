
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator } from 'lucide-react';
import { useRentalHistory } from '@/hooks/use-rental-history';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyAverageCardProps {
  propertyId: string;
}

export const MonthlyAverageCard: React.FC<MonthlyAverageCardProps> = ({
  propertyId
}) => {
  const { rentalHistory, isLoading, averageMonthlyRevenue } = useRentalHistory(propertyId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Média Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  const totalMonths = rentalHistory.length;
  const averageBalance = totalMonths > 0 
    ? rentalHistory.reduce((sum, item) => sum + item.balance, 0) / totalMonths
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Média Mensal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Receita Média</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(averageMonthlyRevenue)}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">Saldo Médio</span>
          </div>
          <p className={`text-xl font-semibold ${
            averageBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(averageBalance)}
          </p>
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <span>Baseado em {totalMonths} mês{totalMonths !== 1 ? 'es' : ''}</span>
        </div>
      </CardContent>
    </Card>
  );
};
