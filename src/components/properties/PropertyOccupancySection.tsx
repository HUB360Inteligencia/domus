
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, PlusCircle, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { usePropertyOccupancy } from '@/hooks/use-property-occupancy';
import { OccupancyType } from '@/types/property-occupancy';
import { OccupancyCalendar } from './OccupancyCalendar';

interface PropertyOccupancySectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyOccupancySection: React.FC<PropertyOccupancySectionProps> = ({
  property,
  isLoading = false,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [occupancyType, setOccupancyType] = useState<OccupancyType>('rented');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [notes, setNotes] = useState('');
  const [hasCurrentOccupancy, setHasCurrentOccupancy] = useState(false);
  const [currentOccupancyId, setCurrentOccupancyId] = useState<string | null>(null);
  const [endCurrentDialogOpen, setEndCurrentDialogOpen] = useState(false);
  const [endCurrentDate, setEndCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const {
    occupancyPeriods,
    vacancyRate,
    isLoadingOccupancy,
    registerOccupancy,
    deleteOccupancy,
    endOccupancy,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePropertyOccupancy(property?.id || null);

  // Check if there is a current occupancy (no end date)
  useEffect(() => {
    const currentOccupancy = occupancyPeriods.find(period => !period.end_date);
    if (currentOccupancy) {
      setHasCurrentOccupancy(true);
      setCurrentOccupancyId(currentOccupancy.id);
    } else {
      setHasCurrentOccupancy(false);
      setCurrentOccupancyId(null);
    }
  }, [occupancyPeriods]);

  const handleAddOccupancy = async () => {
    if (!occupancyType || !startDate) return;
    
    try {
      await registerOccupancy({
        occupancy_type: occupancyType,
        start_date: startDate,
        end_date: endDate || null,
        tenant_name: tenantName || null,
        notes: notes || null,
      });
      
      // Reset form and close dialog
      setOccupancyType('rented');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      setTenantName('');
      setNotes('');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding occupancy period:', error);
    }
  };

  const handleEndCurrentOccupancy = async () => {
    if (!currentOccupancyId || !endCurrentDate) return;
    
    try {
      await endOccupancy(currentOccupancyId, endCurrentDate);
      setEndCurrentDialogOpen(false);
      setEndCurrentDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (error) {
      console.error('Error ending occupancy period:', error);
    }
  };

  const getOccupancyTypeLabel = (type: OccupancyType): string => {
    switch (type) {
      case 'rented': return 'Alugado';
      case 'airbnb': return 'Airbnb';
      case 'vacant': return 'Vago';
      case 'maintenance': return 'Em manutenção';
      case 'owner_occupied': return 'Ocupado pelo proprietário';
      default: return type;
    }
  };

  const getOccupancyTypeBadgeVariant = (type: OccupancyType): string => {
    switch (type) {
      case 'rented': return 'default';
      case 'airbnb': return 'secondary';
      case 'vacant': return 'destructive';
      case 'maintenance': return 'outline';
      case 'owner_occupied': return 'blue';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Histórico de Ocupação</h3>
        <div className="flex gap-2">
          {hasCurrentOccupancy && (
            <Dialog open={endCurrentDialogOpen} onOpenChange={setEndCurrentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Finalizar Ocupação</span>
                  <span className="inline sm:hidden">Finalizar</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalizar Período de Ocupação</DialogTitle>
                  <DialogDescription>
                    Defina a data de término do período de ocupação atual.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end-date" className="text-right">
                      Data de Término
                    </Label>
                    <div className="col-span-3 flex items-center">
                      <Input
                        id="end-date"
                        type="date"
                        value={endCurrentDate}
                        onChange={(e) => setEndCurrentDate(e.target.value)}
                        className="w-full"
                      />
                      <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEndCurrentDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleEndCurrentOccupancy} 
                    disabled={!endCurrentDate || isUpdating}
                  >
                    {isUpdating ? 'Salvando...' : 'Finalizar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar Período</span>
                <span className="inline sm:hidden">Adicionar</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Período de Ocupação</DialogTitle>
                <DialogDescription>
                  Registre um novo período de ocupação para este imóvel.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="occupancy-type" className="text-right">
                    Tipo
                  </Label>
                  <Select 
                    value={occupancyType} 
                    onValueChange={(value) => setOccupancyType(value as OccupancyType)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo de ocupação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rented">Alugado</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="vacant">Vago</SelectItem>
                      <SelectItem value="maintenance">Em manutenção</SelectItem>
                      <SelectItem value="owner_occupied">Ocupado pelo proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">
                    Início
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                    <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end-date" className="text-right">
                    Término
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                      placeholder="Deixe em branco se estiver em andamento"
                    />
                    <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {(occupancyType === 'rented' || occupancyType === 'airbnb') && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tenant-name" className="text-right">
                      Inquilino
                    </Label>
                    <Input
                      id="tenant-name"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="col-span-3"
                      placeholder="Nome do inquilino"
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notas
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="col-span-3"
                    placeholder="Observações adicionais"
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
                  disabled={!occupancyType || !startDate || isCreating}
                >
                  {isCreating ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Vacância</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingOccupancy ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Últimos 12 meses:</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">{vacancyRate !== null ? `${vacancyRate.toFixed(2)}%` : 'N/A'}</span>
                  {vacancyRate !== null && (
                    <>
                      {vacancyRate <= 10 ? (
                        <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 ml-2" />
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {vacancyRate !== null && (
                <div className="space-y-2">
                  <ProgressBar 
                    value={100 - vacancyRate} 
                    className="h-2"
                    indicatorClassName={vacancyRate <= 10 ? "bg-green-500" : 
                                      vacancyRate <= 30 ? "bg-amber-500" : 
                                      "bg-red-500"}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Taxa de Ocupação: {(100 - vacancyRate).toFixed(2)}%</span>
                    <span>Recomendado: {'< 10%'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <OccupancyCalendar 
        occupancyPeriods={occupancyPeriods}
        isLoading={isLoading || isLoadingOccupancy}
      />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ocupação</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingOccupancy ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : occupancyPeriods.length > 0 ? (
            <div className="space-y-4">
              {occupancyPeriods.map((period) => (
                <div key={period.id} className="flex justify-between items-center border-b pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getOccupancyTypeBadgeVariant(period.occupancy_type)}>
                        {getOccupancyTypeLabel(period.occupancy_type)}
                      </Badge>
                      {!period.end_date && (
                        <Badge variant="outline" className="bg-blue-50">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm">
                      {format(new Date(period.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      {' → '}
                      {period.end_date 
                        ? format(new Date(period.end_date), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Atual'
                      }
                    </p>
                    
                    {period.tenant_name && (
                      <p className="text-sm text-muted-foreground">Inquilino: {period.tenant_name}</p>
                    )}
                    
                    {period.notes && (
                      <p className="text-xs text-muted-foreground italic">{period.notes}</p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    disabled={isDeleting}
                    onClick={() => deleteOccupancy(period.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum período de ocupação registrado ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
