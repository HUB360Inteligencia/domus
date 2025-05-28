
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyInvestments } from '@/hooks/use-property-investments';

interface PropertyFinancialDetailsCardProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyFinancialDetailsCard: React.FC<PropertyFinancialDetailsCardProps> = ({
  property,
  isLoading
}) => {
  const { totalInvestment, isLoadingInvestments } = usePropertyInvestments(property?.id || null);

  // Helper function to format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const purchaseValue = property?.purchase_value || 0;
  const additionalInvestments = totalInvestment - purchaseValue;

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white h-full">
      <CardHeader>
        <CardTitle className="text-lg">Detalhes Financeiros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || isLoadingInvestments ? (
          <>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor de Mercado</span>
              <span className="font-medium">{formatCurrency(property?.value)}</span>
            </div>
            
            {property?.purchase_value && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor de Aquisição</span>
                <span className="font-medium">{formatCurrency(property.purchase_value)}</span>
              </div>
            )}
            
            {additionalInvestments > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investimentos Extras</span>
                <span className="font-medium text-blue-600">{formatCurrency(additionalInvestments)}</span>
              </div>
            )}
            
            {totalInvestment > 0 && (
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground font-medium">Total Investido</span>
                <span className="font-bold">{formatCurrency(totalInvestment)}</span>
              </div>
            )}
            
            {property?.rental_value && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor do Aluguel</span>
                <span className="font-medium">{formatCurrency(property.rental_value)}</span>
              </div>
            )}
            
            {property?.area && property?.value && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor por m²</span>
                <span className="font-medium">{formatCurrency(property.value / property.area)}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
