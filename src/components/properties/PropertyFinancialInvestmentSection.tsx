
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyFinancialSection } from './PropertyFinancialSection';
import { PropertyInvestmentOverview } from './PropertyInvestmentOverview';
import { InvestmentsList } from './InvestmentsList';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { MetricWidget } from '@/components/finances/dashboard/MetricWidget';

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

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular métricas financeiras
  const currentValue = property?.value || 0;
  const purchaseValue = property?.purchase_value || 0;
  const appreciation = currentValue - purchaseValue;
  const appreciationPercent = purchaseValue > 0 ? ((appreciation / purchaseValue) * 100) : 0;
  const squareMeterValue = property?.area && property?.area > 0 ? (currentValue / property.area) : 0;

  return (
    <div className="space-y-8">
      {/* Primeira Linha: Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MinimalCard>
          <MetricWidget
            title="Valor Atual"
            value={formatCurrency(currentValue)}
            icon={<div className="h-4 w-4 bg-blue-500 rounded" />}
            trend={appreciationPercent > 0 ? 'up' : appreciationPercent < 0 ? 'down' : 'neutral'}
            trendValue={`${appreciationPercent >= 0 ? '+' : ''}${appreciationPercent.toFixed(1)}%`}
          />
        </MinimalCard>

        <MinimalCard>
          <MetricWidget
            title="Valor de Aquisição"
            value={formatCurrency(purchaseValue)}
            subtitle={property?.purchase_date ? `Comprado em ${new Date(property.purchase_date).toLocaleDateString('pt-BR')}` : undefined}
            icon={<div className="h-4 w-4 bg-green-500 rounded" />}
          />
        </MinimalCard>

        <MinimalCard>
          <MetricWidget
            title="Valorização"
            value={formatCurrency(Math.abs(appreciation))}
            icon={<div className="h-4 w-4 bg-purple-500 rounded" />}
            trend={appreciation > 0 ? 'up' : appreciation < 0 ? 'down' : 'neutral'}
            trendValue={`${appreciation >= 0 ? '+' : ''}${appreciationPercent.toFixed(1)}%`}
          />
        </MinimalCard>

        <MinimalCard>
          <MetricWidget
            title="Valor m²"
            value={squareMeterValue > 0 ? formatCurrency(squareMeterValue) : 'N/A'}
            subtitle={property?.area ? `${property.area} m² total` : undefined}
            icon={<div className="h-4 w-4 bg-orange-500 rounded" />}
          />
        </MinimalCard>
      </div>

      {/* Segunda Linha: Gráfico de Valorização + Indicadores Financeiros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Valorização (2/3) */}
        <div className="lg:col-span-2">
          <PropertyFinancialSection property={property} isLoading={isLoading} />
        </div>

        {/* Indicadores Financeiros (1/3) */}
        <div className="space-y-6">
          <MinimalCard>
            <MetricWidget
              title="ROI Mensal"
              value="2.5%"
              subtitle="Baseado no aluguel atual"
              icon={<div className="h-4 w-4 bg-green-500 rounded" />}
              trend="up"
              trendValue="+0.3% vs mês anterior"
            />
          </MinimalCard>

          <MinimalCard>
            <MetricWidget
              title="Taxa de Vacância"
              value="15%"
              subtitle="Últimos 12 meses"
              icon={<div className="h-4 w-4 bg-red-500 rounded" />}
              trend="down"
              trendValue="-5% vs ano anterior"
            />
          </MinimalCard>

          <MinimalCard>
            <MetricWidget
              title="Rentabilidade Acumulada"
              value="18.7%"
              subtitle="Desde a aquisição"
              icon={<div className="h-4 w-4 bg-blue-500 rounded" />}
              trend="up"
              trendValue="+2.1% este ano"
            />
          </MinimalCard>
        </div>
      </div>

      <Separator />

      {/* Seção Unificada de Investimentos */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Gestão de Investimentos</h3>
          <Button onClick={() => setShowNewInvestmentModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Novo Investimento
          </Button>
        </div>

        {/* Resumo dos Investimentos */}
        <div>
          <h4 className="text-lg font-medium mb-4">Resumo dos Investimentos</h4>
          <PropertyInvestmentOverview property={property} />
        </div>

        <Separator />

        {/* Histórico de Investimentos */}
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
            <p className="text-sm text-muted-foreground mt-2">
              Incluirá campos para: tipo de investimento, valor, data, descrição, comprovante, etc.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
