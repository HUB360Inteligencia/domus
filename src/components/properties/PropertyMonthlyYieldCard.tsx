
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, BarChart, CheckCircle, AlertCircle } from 'lucide-react';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useContractsByProperty } from '@/hooks/use-contracts-by-property';
import { usePropertyTransactions } from '@/hooks/use-property-transactions';

interface PropertyMonthlyYieldCardProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyMonthlyYieldCard: React.FC<PropertyMonthlyYieldCardProps> = ({
  property,
  isLoading,
}) => {
  const { activeContract, isLoading: isLoadingContracts } = useContractsByProperty(property?.id || null);
  const { averageMonthlyRevenue, isLoading: isLoadingTransactions, transactionCount } = usePropertyTransactions(property?.id || null, 12);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateMonthlyContractValue = () => {
    // Usar APENAS o valor do contrato ativo
    if (activeContract?.value) {
      return activeContract.value;
    }
    return null;
  };

  const calculateMonthlyROIOnMarketValue = () => {
    const monthlyRent = calculateMonthlyContractValue();
    if (!monthlyRent || !property?.value) return null;
    // ROI MENSAL (não anualizado)
    return (monthlyRent / property.value) * 100;
  };

  const calculateMonthlyROIOnPurchaseValue = () => {
    const monthlyRent = calculateMonthlyContractValue();
    if (!monthlyRent || !property?.purchase_value) return null;
    // ROI MENSAL (não anualizado)
    return (monthlyRent / property.purchase_value) * 100;
  };

  const formatROI = (roi: number | null) => {
    if (roi === null) {
      return {
        value: 'N/A',
        isPositive: false,
        icon: AlertCircle,
        colorClass: 'text-muted-foreground'
      };
    }
    
    const isPositive = roi >= 0;
    return {
      value: `${roi >= 0 ? '+' : ''}${roi.toFixed(3)}%`,
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      colorClass: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  if (isLoading || isLoadingContracts || isLoadingTransactions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ROI Mensal do Contrato</CardTitle>
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

  const monthlyContractValue = calculateMonthlyContractValue();
  const roiOnMarket = calculateMonthlyROIOnMarketValue();
  const roiOnPurchase = calculateMonthlyROIOnPurchaseValue();

  const roiMarketFormatted = formatROI(roiOnMarket);
  const roiPurchaseFormatted = formatROI(roiOnPurchase);

  const hasActiveContract = !!activeContract;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ROI Mensal do Contrato
          </div>
          {hasActiveContract ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Contrato Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Sem Contrato
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Valor do Contrato Mensal
          </span>
          <span className={`font-medium text-lg ${hasActiveContract ? 'text-green-600' : 'text-muted-foreground'}`}>
            {formatCurrency(monthlyContractValue)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Rendimento Médio Mensal</span>
          </div>
          <div className="text-right">
            <span className="font-medium text-blue-600">
              {formatCurrency(averageMonthlyRevenue)}
            </span>
            <div className="text-xs text-muted-foreground">
              {transactionCount > 0 
                ? `últimos 12 meses ${transactionCount < 12 ? `(${transactionCount} meses)` : ''}`
                : 'sem dados'
              }
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">ROI Mensal do Contrato s/ Valor de Mercado</span>
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
          <span className="text-sm text-muted-foreground">ROI Mensal do Contrato s/ Valor de Compra</span>
          <div className="flex items-center gap-1">
            {roiPurchaseFormatted.value !== 'N/A' && (
              <roiPurchaseFormatted.icon className={`h-4 w-4 ${roiPurchaseFormatted.colorClass}`} />
            )}
            <span className={`font-medium ${roiPurchaseFormatted.colorClass}`}>
              {roiPurchaseFormatted.value}
            </span>
          </div>
        </div>

        {!hasActiveContract && (
          <div className="pt-2 border-t bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Nenhum contrato ativo encontrado. ROI baseado em contrato não disponível.</span>
            </div>
          </div>
        )}

        {hasActiveContract && monthlyContractValue && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Receita Anual Estimada (Contrato)</span>
              <span>{formatCurrency(monthlyContractValue * 12)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-green-600 mt-1">
              <span>Baseado em contrato ativo</span>
              <CheckCircle className="h-3 w-3" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
