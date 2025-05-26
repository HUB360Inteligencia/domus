
import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PropertyValuationChart } from './PropertyValuationChart';
import { Property, PropertyValuation } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePropertyValuations } from '@/hooks/use-property-valuations';
import { usePropertyFinancialMetrics } from '@/hooks/use-property-financial-metrics';
import { CurrencyInput } from '@/components/ui/currency-input';

interface PropertyFinancialSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyFinancialSection: React.FC<PropertyFinancialSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newValuationValue, setNewValuationValue] = useState('');
  const [newValuationDate, setNewValuationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newValuationNotes, setNewValuationNotes] = useState('');

  const {
    valuations,
    isLoading: isLoadingValuations,
    createValuation,
    isCreating,
  } = usePropertyValuations(property?.id || null);

  const {
    financialMetrics,
    isLoadingMetrics,
  } = usePropertyFinancialMetrics(property?.id || null);

  const handleAddValuation = async () => {
    if (!newValuationValue || !property?.id) return;
    
    try {
      await createValuation({
        value: Number(newValuationValue),
        date: newValuationDate,
        notes: newValuationNotes || undefined
      });
      
      // Reset form and close dialog
      setNewValuationValue('');
      setNewValuationDate(format(new Date(), 'yyyy-MM-dd'));
      setNewValuationNotes('');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding valuation:', error);
    }
  };

  const renderFinancialCard = (
    title: string, 
    value: string | number | React.ReactNode, 
    subtitle?: string,
    isHighlighted: boolean = false
  ) => {
    if (isLoading || isLoadingMetrics) {
      return (
        <Card className={`overflow-hidden ${isHighlighted ? 'border-blue-500 shadow-md' : ''}`}>
          <CardContent className="p-6">
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-8 w-3/4 mb-1" />
            {subtitle && <Skeleton className="h-4 w-1/3" />}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`overflow-hidden ${isHighlighted ? 'border-blue-500 shadow-md' : ''}`}>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate latest valuation value
  const latestValuation = valuations.length > 0
    ? valuations.reduce((latest, current) => {
        return new Date(current.valuation_date) > new Date(latest.valuation_date) 
          ? current 
          : latest;
      }, valuations[0])
    : null;
  
  const currentMarketValue = latestValuation?.value || property?.value || 0;
  const purchaseValue = property?.purchase_value || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Financeiro do Imóvel</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar Avaliação</span>
              <span className="inline sm:hidden">Avaliação</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Avaliação</DialogTitle>
              <DialogDescription>
                Registre uma nova avaliação para o imóvel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Valor
                </Label>
                <div className="col-span-3">
                  <CurrencyInput
                    id="value"
                    value={newValuationValue}
                    onChange={setNewValuationValue}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <div className="col-span-3 flex items-center">
                  <Input
                    id="date"
                    type="date"
                    value={newValuationDate}
                    onChange={(e) => setNewValuationDate(e.target.value)}
                    className="w-full"
                  />
                  <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={newValuationNotes}
                  onChange={(e) => setNewValuationNotes(e.target.value)}
                  className="col-span-3"
                  placeholder="Detalhes sobre a avaliação"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleAddValuation} 
                disabled={!newValuationValue || isCreating}
              >
                {isCreating ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <PropertyValuationChart 
        valuations={valuations}
        purchaseDate={property?.purchase_date || null}
        purchaseValue={property?.purchase_value || null}
        isLoading={isLoading || isLoadingValuations}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          purchaseValue > 0 
            ? <span className={`${currentMarketValue > purchaseValue ? 'text-green-500' : 'text-red-500'}`}>
                {((currentMarketValue - purchaseValue) / purchaseValue * 100).toFixed(2)}%
              </span>
            : 'N/A',
          purchaseValue > 0 
            ? `${formatCurrency(currentMarketValue - purchaseValue)} de diferença` 
            : 'Valor de aquisição não informado'
        )}
      </div>

      <Separator className="my-6" />

      <div>
        <h4 className="text-lg font-medium mb-4">Indicadores Financeiros</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderFinancialCard(
            'Valor por m²',
            property?.area ? formatCurrency(currentMarketValue / property.area) : 'N/A',
            property?.area ? `Área: ${property.area} m²` : 'Área não informada'
          )}
          
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
  );
};
