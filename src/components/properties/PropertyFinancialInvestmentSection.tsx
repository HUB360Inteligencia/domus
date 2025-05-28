
import React, { useState } from 'react';
import { Property } from '@/types/property';
import { PropertyFinancialSection } from './PropertyFinancialSection';
import { PropertyInvestmentOverview } from './PropertyInvestmentOverview';
import { InvestmentsList } from './InvestmentsList';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PropertyValuationChart } from './PropertyValuationChart';
import { usePropertyValuations } from '@/hooks/use-property-valuations';
import { usePropertyFinancialMetrics } from '@/hooks/use-property-financial-metrics';
import { usePropertyAppreciation } from '@/hooks/use-property-appreciation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropertyFinancialInvestmentSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyFinancialInvestmentSection: React.FC<PropertyFinancialInvestmentSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [showNewInvestmentModal, setShowNewInvestmentModal] = useState(false);
  const { investments, isLoadingInvestments } = usePropertyInvestments(property?.id || null);
  const { valuations, isLoading: isLoadingValuations } = usePropertyValuations(property?.id || null);
  const { financialMetrics, isLoadingMetrics } = usePropertyFinancialMetrics(property?.id || null);
  const appreciation = usePropertyAppreciation({ property, valuations });

  // Helper function to format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculateROI = (currentValue: number, purchaseValue: number) => {
    if (!currentValue || !purchaseValue) return null;
    return ((currentValue - purchaseValue) / purchaseValue) * 100;
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
      value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`,
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      colorClass: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  const latestValuation = valuations.length > 0
    ? valuations.reduce((latest, current) => {
        return new Date(current.valuation_date) > new Date(latest.valuation_date) 
          ? current 
          : latest;
      }, valuations[0])
    : null;
  
  const currentMarketValue = latestValuation?.value || property?.value || 0;
  const purchaseValue = property?.purchase_value || 0;
  const roiOnPurchase = calculateROI(currentMarketValue, purchaseValue);
  const roiPurchaseFormatted = formatROI(roiOnPurchase);

  const renderFinancialCard = (
    title: string, 
    value: string | number | React.ReactNode, 
    subtitle?: string,
    isHighlighted: boolean = false
  ) => {
    if (isLoading || isLoadingValuations || isLoadingMetrics) {
      return (
        <Card className={`border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden ${isHighlighted ? 'border-blue-500 shadow-md' : ''}`}>
          <CardContent className="p-4 sm:p-6">
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-8 w-3/4 mb-1" />
            {subtitle && <Skeleton className="h-4 w-1/3" />}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden ${isHighlighted ? 'border-blue-500 shadow-md' : ''}`}>
        <CardContent className="p-4 sm:p-6">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Financeiro do Imóvel</h3>
      </div>

      {/* Primeira Linha: Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderFinancialCard(
          'Valor Atual de Mercado',
          formatCurrency(currentMarketValue),
          latestValuation ? `Atualizado em ${format(new Date(latestValuation.valuation_date), 'dd/MM/yyyy', { locale: ptBR })}` : 'Valor estimado',
          true
        )}
        
        {renderFinancialCard(
          'Valor de Aquisição',
          formatCurrency(purchaseValue),
          property?.purchase_date 
            ? `Adquirido em ${format(new Date(property.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}` 
            : 'Data não informada'
        )}
        
        {renderFinancialCard(
          'Valorização',
          appreciation.hasData ? (
            <div className="flex items-center gap-1">
              {appreciation.percentage >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={appreciation.formatted.colorClass}>
                {appreciation.formatted.formatted}
              </span>
            </div>
          ) : 'N/A',
          appreciation.hasData 
            ? `${formatCurrency(appreciation.absolute)} de diferença` 
            : 'Valor de aquisição não informado'
        )}
        
        {renderFinancialCard(
          'Valor por m²',
          property?.area ? formatCurrency(currentMarketValue / property.area) : 'N/A',
          property?.area ? `Área: ${property.area} m²` : 'Área não informada'
        )}
      </div>

      {/* Segunda Linha: Gráfico + Indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Valorização - 2/3 */}
        <div className="lg:col-span-2">
          <PropertyValuationChart 
            valuations={valuations}
            purchaseDate={property?.purchase_date || null}
            purchaseValue={property?.purchase_value || null}
            isLoading={isLoading || isLoadingValuations}
          />
        </div>

        {/* Indicadores Financeiros - 1/3 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Indicadores Financeiros</h4>
          <div className="space-y-4">
            {renderFinancialCard(
              'Rentabilidade Mensal',
              financialMetrics ? formatPercentage(financialMetrics.monthlyProfitability) : 'N/A',
              financialMetrics ? 'Média últimos 12 meses' : 'Sem dados suficientes'
            )}
            
            {renderFinancialCard(
              'ROI Acumulado',
              financialMetrics ? formatPercentage(financialMetrics.accumulatedROI) : 'N/A',
              financialMetrics ? `${formatCurrency(financialMetrics.netIncome)} de retorno líquido` : 'Sem dados de transações'
            )}
            
            {renderFinancialCard(
              'Taxa de Vacância',
              financialMetrics ? formatPercentage(financialMetrics.vacancyRate) : 'N/A',
              financialMetrics ? 'Últimos 12 meses' : 'Sem dados de ocupação'
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Seção Unificada de Investimentos */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Gestão de Investimentos</h3>
          <Button onClick={() => setShowNewInvestmentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Novo Investimento
          </Button>
        </div>

        {/* Resumo dos Investimentos */}
        <div>
          <h4 className="text-lg font-medium mb-4">Resumo dos Investimentos</h4>
          <PropertyInvestmentOverview property={property} />
        </div>

        <Separator />

        {/* Histórico de Investimentos Melhorado */}
        <div>
          <h4 className="text-lg font-medium mb-4">Histórico de Investimentos</h4>
          <InvestmentsList 
            property={property}
            investments={investments}
            isLoading={isLoading || isLoadingInvestments}
          />
        </div>
      </div>

      {/* Modal de Novo Investimento */}
      <Dialog open={showNewInvestmentModal} onOpenChange={setShowNewInvestmentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Investimento</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-muted-foreground">
              Formulário de investimento será implementado aqui.
              Propriedade: {property?.title}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
