
import React, { useState } from 'react';
import { Calendar, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PropertyValuationChart } from './PropertyValuationChart';
import { PropertyImageGallery } from './PropertyImageGallery';
import { Property, PropertyValuation } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePropertyValuations } from '@/hooks/use-property-valuations';
import { useNavigate } from 'react-router-dom';
import { usePropertyFinancial } from '@/hooks/use-property-financial';

interface PropertyFinancialSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyFinancialSection: React.FC<PropertyFinancialSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const navigate = useNavigate();
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
    financialData,
    isLoading: isLoadingFinancial,
    calculateFinancial,
    isCalculating,
  } = usePropertyFinancial(property?.id || null);

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

      // Update financial data
      calculateFinancial();
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
    if (isLoading || isLoadingFinancial) {
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

  const handleViewFullReport = () => {
    if (property?.id) {
      navigate(`/properties/roi-report?id=${property.id}`);
    }
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
  const totalInvestment = financialData?.totalInvestment || property?.total_investment || purchaseValue;
  const monthlyNetReturn = financialData?.monthlyNetReturn || property?.monthly_return_rate || 0;
  const vacancyRate = financialData?.vacancyRate || property?.vacancy_rate || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Financeiro do Imóvel</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => calculateFinancial()} disabled={isCalculating}>
            {isCalculating ? 'Calculando...' : 'Atualizar Dados'}
          </Button>
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
                  <div className="col-span-3 flex items-center">
                    <span className="mr-2">R$</span>
                    <Input
                      id="value"
                      type="number"
                      value={newValuationValue}
                      onChange={(e) => setNewValuationValue(e.target.value)}
                      className="w-full"
                      placeholder="0,00"
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
      </div>

      {property?.id && (
        <PropertyImageGallery propertyId={property.id} />
      )}

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
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium">Mais Indicadores Financeiros</h4>
          <Button onClick={handleViewFullReport} size="sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            Ver Relatório Completo
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderFinancialCard(
            'Valor por m²',
            property?.area ? formatCurrency(currentMarketValue / property.area) : 'N/A',
            property?.area ? `Área: ${property.area} m²` : 'Área não informada'
          )}
          
          {renderFinancialCard(
            'Rentabilidade Mensal',
            monthlyNetReturn ? `${monthlyNetReturn.toFixed(2)}%` : 'Calculando...',
            totalInvestment > 0 ? `Sobre investimento de ${formatCurrency(totalInvestment)}` : 'Investimento não informado'
          )}
          
          {renderFinancialCard(
            'ROI Acumulado',
            financialData?.accumulatedROI ? `${financialData.accumulatedROI.toFixed(2)}%` : 'Calculando...',
            'Retorno sobre investimento'
          )}
          
          {renderFinancialCard(
            'Vacância',
            `${vacancyRate}%`,
            'Últimos 12 meses'
          )}
        </div>
      </div>
    </div>
  );
};
