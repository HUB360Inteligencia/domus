
import React, { useState, useEffect } from 'react';
import { Plus, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Property } from '@/types/property';
import { OccupancyType } from '@/types/property-occupancy';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePropertyOccupancy } from '@/hooks/use-property-occupancy';
import { usePropertyFinancialMetrics } from '@/hooks/use-property-financial-metrics';

interface PropertyOccupancySectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyOccupancySection: React.FC<PropertyOccupancySectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOccupancyData, setNewOccupancyData] = useState({
    occupancy_type: 'traditional_rental' as OccupancyType,
    tenant_name: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: '',
  });

  const {
    occupancyPeriods,
    vacancyRate,
    isLoadingOccupancy,
    isCreating,
    registerOccupancy,
    endOccupancy,
    refetchOccupancy,
  } = usePropertyOccupancy(property?.id || null);

  const {
    activeContract,
    isLoadingContract,
  } = usePropertyFinancialMetrics(property?.id || null);

  // Auto-fill occupancy data from active contract
  useEffect(() => {
    if (activeContract && !newOccupancyData.tenant_name) {
      setNewOccupancyData(prev => ({
        ...prev,
        tenant_name: activeContract.tenant_name || '',
        start_date: activeContract.start_date || format(new Date(), 'yyyy-MM-dd'),
        end_date: activeContract.end_date || '',
        occupancy_type: 'traditional_rental' as OccupancyType,
      }));
    }
  }, [activeContract, newOccupancyData.tenant_name]);

  const handleAddOccupancy = async () => {
    if (!newOccupancyData.tenant_name || !newOccupancyData.start_date) return;
    
    try {
      await registerOccupancy(newOccupancyData);
      
      // Reset form and close dialog
      setNewOccupancyData({
        occupancy_type: 'traditional_rental' as OccupancyType,
        tenant_name: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        notes: '',
      });
      setIsAddDialogOpen(false);
      refetchOccupancy();
    } catch (error) {
      console.error('Error adding occupancy:', error);
    }
  };

  const getOccupancyTypeLabel = (type: OccupancyType) => {
    const labels = {
      traditional_rental: 'Aluguel Tradicional',
      airbnb: 'Airbnb',
      owner_occupied: 'Ocupação do Proprietário',
      vacant: 'Vago',
      maintenance: 'Manutenção',
      other: 'Outros'
    };
    return labels[type] || type;
  };

  const getOccupancyStatusBadge = (period: any) => {
    const now = new Date();
    const startDate = new Date(period.start_date);
    const endDate = period.end_date ? new Date(period.end_date) : null;

    if (!endDate || endDate > now) {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    } else {
      return <Badge variant="outline">Finalizado</Badge>;
    }
  };

  const currentOccupancy = occupancyPeriods.find(period => {
    const now = new Date();
    const startDate = new Date(period.start_date);
    const endDate = period.end_date ? new Date(period.end_date) : null;
    return startDate <= now && (!endDate || endDate > now);
  });

  if (isLoading || isLoadingOccupancy || isLoadingContract) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-8 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Ocupação do Imóvel</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Registrar Ocupação</span>
              <span className="inline sm:hidden">Ocupação</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Período de Ocupação</DialogTitle>
              <DialogDescription>
                Registre um novo período de ocupação para este imóvel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="occupancy_type" className="text-right">
                  Tipo
                </Label>
                <Select 
                  value={newOccupancyData.occupancy_type} 
                  onValueChange={(value: OccupancyType) => 
                    setNewOccupancyData(prev => ({ ...prev, occupancy_type: value }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traditional_rental">Aluguel Tradicional</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="owner_occupied">Ocupação do Proprietário</SelectItem>
                    <SelectItem value="vacant">Vago</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tenant_name" className="text-right">
                  Locatário
                </Label>
                <Input
                  id="tenant_name"
                  value={newOccupancyData.tenant_name}
                  onChange={(e) => setNewOccupancyData(prev => ({ ...prev, tenant_name: e.target.value }))}
                  className="col-span-3"
                  placeholder="Nome do locatário"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right">
                  Data Início
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newOccupancyData.start_date}
                  onChange={(e) => setNewOccupancyData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right">
                  Data Fim
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newOccupancyData.end_date}
                  onChange={(e) => setNewOccupancyData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="col-span-3"
                  placeholder="Opcional"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={newOccupancyData.notes}
                  onChange={(e) => setNewOccupancyData(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3"
                  placeholder="Observações sobre a ocupação"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleAddOccupancy} 
                disabled={!newOccupancyData.tenant_name || isCreating}
              >
                {isCreating ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contract Integration Alert */}
      {activeContract && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>
                Existe um contrato ativo para este imóvel com <strong>{activeContract.tenant_name}</strong>
                {' '}de {format(new Date(activeContract.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                {' '}até {format(new Date(activeContract.end_date), 'dd/MM/yyyy', { locale: ptBR })}.
              </span>
              {!currentOccupancy && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  Registrar Ocupação
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Occupancy Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Status Atual</div>
            <div className="text-2xl font-bold">
              {currentOccupancy ? 'Ocupado' : 'Vago'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentOccupancy 
                ? `${getOccupancyTypeLabel(currentOccupancy.occupancy_type)}`
                : 'Disponível para locação'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Taxa de Vacância</div>
            <div className="text-2xl font-bold text-red-500">
              {vacancyRate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Últimos 12 meses
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Períodos Registrados</div>
            <div className="text-2xl font-bold text-blue-600">
              {occupancyPeriods.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Histórico de ocupação
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Occupancy */}
      {currentOccupancy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Ocupação Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">
                    {getOccupancyTypeLabel(currentOccupancy.occupancy_type)}
                  </Badge>
                  {getOccupancyStatusBadge(currentOccupancy)}
                </div>
                <p className="font-medium">{currentOccupancy.tenant_name}</p>
                <p className="text-sm text-muted-foreground">
                  Desde {format(new Date(currentOccupancy.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                  {currentOccupancy.end_date && 
                    ` até ${format(new Date(currentOccupancy.end_date), 'dd/MM/yyyy', { locale: ptBR })}`
                  }
                </p>
                {currentOccupancy.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{currentOccupancy.notes}</p>
                )}
              </div>
              {!currentOccupancy.end_date && (
                <Button
                  variant="outline"
                  onClick={() => endOccupancy(currentOccupancy.id, format(new Date(), 'yyyy-MM-dd'))}
                >
                  Finalizar Ocupação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Occupancy History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ocupação</CardTitle>
        </CardHeader>
        <CardContent>
          {occupancyPeriods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum período de ocupação registrado</p>
              <p className="text-sm">Registre períodos de ocupação para acompanhar a vacância</p>
            </div>
          ) : (
            <div className="space-y-4">
              {occupancyPeriods.map((period) => (
                <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-blue-100 text-blue-800">
                        {getOccupancyTypeLabel(period.occupancy_type)}
                      </Badge>
                      {getOccupancyStatusBadge(period)}
                    </div>
                    <p className="font-medium">{period.tenant_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(period.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      {period.end_date && 
                        ` - ${format(new Date(period.end_date), 'dd/MM/yyyy', { locale: ptBR })}`
                      }
                    </p>
                    {period.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{period.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
