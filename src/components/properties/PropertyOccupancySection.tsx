
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OccupancyType } from '@/types/property-occupancy';
import { usePropertyOccupancy } from '@/hooks/use-property-occupancy';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Calculator } from 'lucide-react';

interface PropertyOccupancySectionProps {
  propertyId: string;
  vacancyRate?: number | null;
}

export const PropertyOccupancySection: React.FC<PropertyOccupancySectionProps> = ({ 
  propertyId,
  vacancyRate 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [occupancyType, setOccupancyType] = useState<OccupancyType>('rented');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [notes, setNotes] = useState('');

  const { 
    occupancyPeriods, 
    isLoading, 
    isCreating,
    calculateVacancy,
    isCalculating,
    createOccupancy,
  } = usePropertyOccupancy(propertyId);

  const resetForm = () => {
    setOccupancyType('rented');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
    setTenantName('');
    setNotes('');
  };

  const handleSubmit = () => {
    createOccupancy({
      property_id: propertyId,
      occupancy_type: occupancyType,
      start_date: startDate,
      end_date: endDate || undefined,
      tenant_name: tenantName || undefined,
      notes: notes || undefined
    }, {
      onSuccess: () => {
        resetForm();
        setIsAddDialogOpen(false);
      }
    });
  };

  const getOccupancyTypeLabel = (type: OccupancyType) => {
    const types = {
      'rented': 'Alugado',
      'airbnb': 'Airbnb',
      'owner_occupied': 'Ocupado pelo Proprietário',
      'vacant': 'Vago'
    };
    return types[type] || type;
  };

  const getOccupancyTypeColor = (type: OccupancyType) => {
    const colors = {
      'rented': 'bg-green-100 text-green-800',
      'airbnb': 'bg-blue-100 text-blue-800',
      'owner_occupied': 'bg-amber-100 text-amber-800',
      'vacant': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getDurationText = (startDate: string, endDate?: string) => {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : new Date();
    const days = differenceInDays(end, start);
    
    if (days < 30) {
      return `${days} dia${days !== 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mês/meses`;
    } else {
      const years = Math.floor(days / 365);
      const remainingMonths = Math.floor((days % 365) / 30);
      return `${years} ano${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` e ${remainingMonths} mês/meses` : ''}`;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Histórico de Ocupação</h3>
            {typeof vacancyRate === 'number' && (
              <Badge 
                variant="outline" 
                className={`ml-2 ${vacancyRate > 10 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}
              >
                Taxa de Vacância: {vacancyRate}%
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => calculateVacancy()}
              disabled={isCalculating}
            >
              <Calculator className="h-4 w-4 mr-1" />
              {isCalculating ? 'Calculando...' : 'Calcular Vacância'}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  Adicionar Período
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Período de Ocupação</DialogTitle>
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
                        <SelectItem value="owner_occupied">Ocupado pelo Proprietário</SelectItem>
                        <SelectItem value="vacant">Vago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="start-date" className="text-right">
                      Data de Início
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end-date" className="text-right">
                      Data de Término
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full"
                        placeholder="Deixe em branco se estiver em andamento"
                      />
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
                        placeholder="Nome do inquilino/hóspede"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Observações
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="col-span-3"
                      placeholder="Observações adicionais"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!startDate || isCreating}
                  >
                    {isCreating ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : occupancyPeriods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="mx-auto h-10 w-10 mb-2" />
            <p>Nenhum período de ocupação registrado. Adicione um período para acompanhar o histórico de ocupação do imóvel.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occupancyPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <Badge className={getOccupancyTypeColor(period.occupancy_type)}>
                        {getOccupancyTypeLabel(period.occupancy_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(period.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      {' até '}
                      {period.end_date 
                        ? format(parseISO(period.end_date), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Presente'}
                    </TableCell>
                    <TableCell>
                      {getDurationText(period.start_date, period.end_date)}
                    </TableCell>
                    <TableCell>{period.tenant_name || '-'}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{period.notes || '-'}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};
