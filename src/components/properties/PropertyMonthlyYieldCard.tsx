
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyMonthlyYieldCardProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyMonthlyYieldCard: React.FC<PropertyMonthlyYieldCardProps> = ({
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

  const calculateMonthlyYield = () => {
    if (!property?.rental_value) return null;
    return property.rental_value;
  };

  const calculateROIOnMarketValue = () => {
    if (!property?.rental_value || !property?.value) return null;
    const annualRental = property.rental_value * 12;
    return (annualRental / property.value) * 100;
  };

  const calculateROIOnPurchaseValue = () => {
    if (!property?.rental_value || !property?.purchase_value) return null;
    const annualRental = property.rental_value * 12;
    return (annualRental / property.purchase_value) * 100;
  };

  const formatROI = (roi: number | null) => {
    if (roi === null) {
      return {
        value: 'N/A',
        isPositive: false,
        icon: TrendingUp,
        colorClass: 'text-muted-foreground'
      };
    }
    
    const isPositive = roi >= 0;
    return {
      value: `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`,
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      colorClass: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rendimento Mensal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const monthlyYield = calculateMonthlyYield();
  const roiOnMarket = calculateROIOnMarketValue();
  const roiOnPurchase = calculateROIOnPurchaseValue();

  const roiMarketFormatted = formatROI(roiOnMarket);
  const roiPurchaseFormatted = formatROI(roiOnPurchase);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Rendimento Mensal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Aluguel Mensal</span>
          <span className="font-medium text-lg">
            {formatCurrency(monthlyYield)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">ROI sobre Valor de Mercado</span>
          <div className="flex items-center gap-1">
            {roiMarketFormatted.value !== 'N/A' && (
              <roiMarketFormatted.icon className={`h-4 w-4 ${roiMarketFormatted.colorClass}`} />
            )}
            <span className={`font-medium ${roiMarketFormatted.colorClass}`}>
              {roiMarketFormatted.value}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">ROI sobre Valor de Compra</span>
          <div className="flex items-center gap-1">
            {roiPurchaseFormatted.value !== 'N/A' && (
              <roiPurchaseFormatted.icon className={`h-4 w-4 ${roiPurchaseFormatted.colorClass}`} />
            )}
            <span className={`font-medium ${roiPurchaseFormatted.colorClass}`}>
              {roiPurchaseFormatted.value}
            </span>
          </div>
        </div>

        {property?.rental_value && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Receita Anual Estimada</span>
              <span>{formatCurrency(property.rental_value * 12)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
