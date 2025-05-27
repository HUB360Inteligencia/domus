
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
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

  const calculateROI = (currentValue: number, purchaseValue: number) => {
    if (!currentValue || !purchaseValue) return null;
    return ((currentValue - purchaseValue) / purchaseValue) * 100;
  };

  const formatROI = (roi: number | null) => {
    if (roi === null) return 'N/A';
    const isPositive = roi >= 0;
    return {
      value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`,
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      colorClass: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes Financeiros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const roiOnPurchase = calculateROI(property?.value || 0, property?.purchase_value || 0);
  const roiOnMarket = calculateROI(property?.value || 0, property?.value || 0); // Market ROI would need market comparison data

  const roiPurchaseFormatted = formatROI(roiOnPurchase);
  const roiMarketFormatted = formatROI(roiOnMarket);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Detalhes Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Valor de Compra</span>
          <span className="font-medium">
            {formatCurrency(property?.purchase_value)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Valor Atual de Mercado</span>
          <span className="font-medium">
            {formatCurrency(property?.value)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">ROI sobre Compra</span>
          <div className="flex items-center gap-1">
            {roiPurchaseFormatted.value !== 'N/A' && (
              <roiPurchaseFormatted.icon className={`h-4 w-4 ${roiPurchaseFormatted.colorClass}`} />
            )}
            <span className={`font-medium ${roiPurchaseFormatted.colorClass}`}>
              {roiPurchaseFormatted.value}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Valorização Total</span>
          <span className="font-medium">
            {property?.purchase_value && property?.value 
              ? formatCurrency(property.value - property.purchase_value)
              : 'N/A'
            }
          </span>
        </div>

        {property?.purchase_date && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Data da Compra</span>
              <span>{new Date(property.purchase_date).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
