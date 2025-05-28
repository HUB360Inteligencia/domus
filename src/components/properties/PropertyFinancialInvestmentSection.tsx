
import React, { useState } from 'react';
import { Property } from '@/types/property';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Plus, Filter, SortAsc, SortDesc } from 'lucide-react';
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
import { PropertyInvestmentForm } from './PropertyInvestmentForm';
import { InvestmentHistoryTable } from './InvestmentHistoryTable';

interface PropertyFinancialInvestmentSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyFinancialInvestmentSection: React.FC<PropertyFinancialInvestmentSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [showNewInvestmentModal, setShowNewInvestmentModal] = useState(false);
  const { investments, isLoadingInvestments, totalInvestment } = usePropertyInvestments(property?.id || null);
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

  const latestValuation = valuations.length > 0
    ? valuations.reduce((latest, current) => {
        return new Date(current.valuation_date) > new Date(latest.valuation_date) 
          ? current 
          : latest;
      }, valuations[0])
    : null;
  
  const currentMarketValue = latestValuation?.value || property?.value || 0;
  const purchaseValue = property?.purchase_value || 0;
  const additionalInvestments = totalInvestment - purchaseValue;

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

  const renderFinancialCard = (
    title: string, 
    value: string | number | React.ReactNode, 
    subtitle?: string,
    isHighlighted: boolean = false
  ) => {
    if (isLoading || isLoadingValuations || isLoadingMetrics) {
      return (
        <Card className={`border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden ${isHighlighted ? 'border-blue-500 shadow-md' : ''}`}>
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-6 w-3/4 mb-1" />
            {subtitle && <Skeleton className="h-3 w-1/3" />}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden ${isHighlighted ? 'border-blue-500 shadow-md' : ''}`}>
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <div className="text-lg font-bold">{value}</div>
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

      {/* Primeira Linha: 5 Cards Principais - Tamanhos Reduzidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          'Aquisição + Investimentos',
          formatCurrency((purchaseValue || 0) + (totalInvestment || 0)),
          `Investimentos: ${formatCurrency(totalInvestment || 0)}`
        )}
        
        {renderFinancialCard(
          'Valorização',
          appreciation.hasData ? (
            <div className="flex items-center gap-1">
              {appreciation.percentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
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

        {/* Indicadores Financeiros - 1/3 - Todos em uma coluna */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Indicadores Financeiros</h4>
          <div className="space-y-3">
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

      {/* Seção Unificada de Investimentos - Nova Estrutura */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Gestão de Investimentos</h3>
          <Button onClick={() => setShowNewInvestmentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Novo Investimento
          </Button>
        </div>

        {/* Cards de Investimentos - 3 + 3 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primeira linha: 3 cards principais */}
          {renderFinancialCard(
            'Valor de Aquisição',
            formatCurrency(purchaseValue),
            property?.purchase_date 
              ? `Adquirido em ${format(new Date(property.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}` 
              : 'Valor original de aquisição'
          )}
          
          {renderFinancialCard(
            'Investimentos Adicionais',
            formatCurrency(additionalInvestments),
            `${investments.length} investimento${investments.length !== 1 ? 's' : ''} registrado${investments.length !== 1 ? 's' : ''}`
          )}
          
          {renderFinancialCard(
            'Total Investido',
            formatCurrency(totalInvestment),
            'Aquisição + investimentos adicionais'
          )}
        </div>

        {/* Segunda linha: Distribuição por tipo - tabela minimalista */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Tipo de Investimento</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(distributionByType).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(distributionByType)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, amount]) => {
                        const percentage = totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0;
                        return (
                          <div key={type} className="text-center p-4 border rounded-lg">
                            <div className="text-sm font-medium text-muted-foreground mb-1">
                              {typeLabels[type] || type}
                            </div>
                            <div className="text-lg font-bold">{formatCurrency(amount)}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum investimento adicional registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Histórico de Investimentos com Filtros e Ordenação */}
        <div>
          <h4 className="text-lg font-medium mb-4">Histórico de Investimentos</h4>
          <InvestmentHistoryTable 
            property={property}
            investments={investments}
            isLoading={isLoading || isLoadingInvestments}
          />
        </div>
      </div>

      {/* Modal de Novo Investimento */}
      <Dialog open={showNewInvestmentModal} onOpenChange={setShowNewInvestmentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Investimento</DialogTitle>
          </DialogHeader>
          <PropertyInvestmentForm 
            property={property}
            onSuccess={() => setShowNewInvestmentModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
