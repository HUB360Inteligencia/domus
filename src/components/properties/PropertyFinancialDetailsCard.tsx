
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyFinancialDetailsCardProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyFinancialDetailsCard: React.FC<PropertyFinancialDetailsCardProps> = ({
  property,
  isLoading,
}) => {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card className="h-full min-h-[280px] border border-gray-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Detalhes Financeiros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[280px] border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-50">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          Detalhes Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Atual</span>
          <span className="font-medium text-green-600">{formatCurrency(property?.value)}</span>
        </div>

        {property?.purchase_value && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor de Compra</span>
            <span className="font-medium">{formatCurrency(property.purchase_value)}</span>
          </div>
        )}

        {property?.rental_value && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor do Aluguel</span>
            <span className="font-medium text-blue-600">{formatCurrency(property.rental_value)}</span>
          </div>
        )}

        {property?.purchase_date && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data da Compra</span>
            <span className="font-medium">{formatDate(property.purchase_date)}</span>
          </div>
        )}

        {property?.total_investment && (
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Investimento Total</span>
            <span className="font-medium text-purple-600">{formatCurrency(property.total_investment)}</span>
          </div>
        )}

        {property?.purchase_value && property?.value && (
          <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Valorização
            </span>
            <span className={`font-medium ${
              property.value > property.purchase_value ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(property.value - property.purchase_value)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
