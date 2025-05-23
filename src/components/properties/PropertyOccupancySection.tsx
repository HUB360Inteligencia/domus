import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Property,
} from '@/types/property';
import { 
  PropertyOccupancyPeriod, 
  OccupancyType, 
  PropertyOccupancyFormData 
} from '@/types/property-occupancy';
import { usePropertyOccupancy } from '@/hooks/use-property-occupancy';

const formSchema = z.object({
  occupancy_type: z.enum(['rented', 'airbnb', 'vacant', 'maintenance', 'owner_occupied']),
  start_date: z.date(),
  end_date: z.date().optional().nullable(),
  tenant_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  contract_id: z.string().optional().nullable(),
})

export const PropertyOccupancySection = ({ property, isLoading }: { property: Property | null | undefined; isLoading: boolean }) => {
  const { 
    occupancyPeriods, 
    vacancyRate, 
    isLoadingOccupancy,
    registerOccupancy,
    updateOccupancy,
    endOccupancy,
    deleteOccupancy,
    isCreating,
    isUpdating,
    isDeleting
  } = usePropertyOccupancy(property?.id || null);

  const [isAddOccupancyOpen, setIsAddOccupancyOpen] = useState(false);
  const [isEditOccupancyOpen, setIsEditOccupancyOpen] = useState(false);
  const [selectedOccupancy, setSelectedOccupancy] = useState<PropertyOccupancyPeriod | null>(null);
  const [isEndingOccupancy, setIsEndingOccupancy] = useState(false);
  const [endingPeriodId, setEndingPeriodId] = useState<string | null>(null);
  const [endingDate, setEndingDate] = useState<Date | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      occupancy_type: 'rented',
      start_date: new Date(),
      end_date: null,
      tenant_name: null,
      notes: null,
      contract_id: null,
    },
  })

  const handleOpenAddOccupancy = () => {
    form.reset();
    setIsAddOccupancyOpen(true);
  };

  const handleCloseAddOccupancy = () => {
    setIsAddOccupancyOpen(false);
  };

  const handleOpenEditOccupancy = (occupancy: PropertyOccupancyPeriod) => {
    setSelectedOccupancy(occupancy);
    form.setValue('occupancy_type', occupancy.occupancy_type);
    form.setValue('start_date', new Date(occupancy.start_date));
    form.setValue('end_date', occupancy.end_date ? new Date(occupancy.end_date) : null);
    form.setValue('tenant_name', occupancy.tenant_name || null);
    form.setValue('notes', occupancy.notes || null);
    form.setValue('contract_id', occupancy.contract_id || null);
    setIsEditOccupancyOpen(true);
  };

  const handleCloseEditOccupancy = () => {
    setIsEditOccupancyOpen(false);
    setSelectedOccupancy(null);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await registerOccupancy({
        occupancy_type: values.occupancy_type,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
        tenant_name: values.tenant_name,
        notes: values.notes,
        contract_id: values.contract_id,
      });
      handleCloseAddOccupancy();
    } catch (error) {
      console.error("Error registering occupancy:", error);
    }
  };

  const handleUpdateOccupancy = async (id: string, data: Partial<PropertyOccupancyFormData>) => {
    try {
      await updateOccupancy(id, data);
      handleCloseEditOccupancy();
    } catch (error) {
      console.error("Error updating occupancy:", error);
    }
  };

  const handleOpenEndOccupancy = (periodId: string) => {
    setIsEndingOccupancy(true);
    setEndingPeriodId(periodId);
  };

  const handleCloseEndOccupancy = () => {
    setIsEndingOccupancy(false);
    setEndingPeriodId(null);
    setEndingDate(null);
  };

  const handleConfirmEndOccupancy = async () => {
    if (endingPeriodId && endingDate) {
      try {
        await endOccupancy(endingPeriodId, format(endingDate, 'yyyy-MM-dd'));
        handleCloseEndOccupancy();
      } catch (error) {
        console.error("Error ending occupancy:", error);
      }
    }
  };

  // Function to get proper badge variant based on occupancy type
  const getOccupancyBadgeVariant = (type: OccupancyType): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case 'rented': return "default";
      case 'airbnb': return "secondary";
      case 'vacant': return "outline";
      case 'maintenance': return "destructive";
      case 'owner_occupied': return "secondary";
      default: return "outline";
    }
  };
  
  const translateOccupancyType = (type: OccupancyType): string => {
    switch (type) {
      case 'rented': return 'Alugado';
      case 'airbnb': return 'Airbnb';
      case 'vacant': return 'Vazio';
      case 'maintenance': return 'Manutenção';
      case 'owner_occupied': return 'Proprietário';
      default: return 'Desconhecido';
    }
  };
  
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'N/A';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Vacancy Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Vacância</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">
              {vacancyRate !== null ? `${vacancyRate.toFixed(1)}%` : 'N/A'}
            </div>
          )}
          <p className="text-muted-foreground text-sm">
            Taxa de vacância atual do imóvel.
          </p>
        </CardContent>
      </Card>

      {/* Occupancy History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Ocupação</CardTitle>
          <Button size="sm" onClick={handleOpenAddOccupancy} disabled={isLoading || !property}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Ocupação
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOccupancy ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : occupancyPeriods.length > 0 ? (
                occupancyPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <Badge variant={getOccupancyBadgeVariant(period.occupancy_type)}>
                        {translateOccupancyType(period.occupancy_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(period.start_date)}</TableCell>
                    <TableCell>{formatDate(period.end_date)}</TableCell>
                    <TableCell>{period.tenant_name || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {period.end_date ? (
                        <Button variant="ghost" size="sm" disabled>
                          Finalizado
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditOccupancy(period)} disabled={isUpdating}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleOpenEndOccupancy(period.id)} disabled={isUpdating}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Finalizar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Ocupação</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este período de ocupação? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteOccupancy(period.id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhum período de ocupação registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>
                  Total de períodos: {isLoadingOccupancy ? <Skeleton className="h-4 w-10" /> : occupancyPeriods.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Add Occupancy Dialog */}
      <AlertDialog open={isAddOccupancyOpen} onOpenChange={setIsAddOccupancyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adicionar Período de Ocupação</AlertDialogTitle>
            <AlertDialogDescription>
              Preencha os campos abaixo para registrar um novo período de ocupação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="occupancy_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Ocupação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rented">Alugado</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="vacant">Vazio</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="owner_occupied">Proprietário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <DatePicker
                        onSelect={field.onChange}
                        defaultMonth={field.value}
                        selected={field.value}
                        mode="single"
                      />
                    </FormControl>
                    <FormDescription>
                      Selecione a data de início da ocupação.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim (Opcional)</FormLabel>
                    <FormControl>
                      <DatePicker
                        onSelect={field.onChange}
                        defaultMonth={field.value}
                        selected={field.value}
                        mode="single"
                      />
                    </FormControl>
                    <FormDescription>
                      Selecione a data de fim da ocupação, se aplicável.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Inquilino (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do inquilino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Contrato (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ID do contrato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCloseAddOccupancy}>Cancelar</AlertDialogCancel>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Occupancy Dialog */}
      <AlertDialog open={isEditOccupancyOpen} onOpenChange={setIsEditOccupancyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Período de Ocupação</AlertDialogTitle>
            <AlertDialogDescription>
              Edite os campos abaixo para atualizar o período de ocupação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(async (values) => {
              if (selectedOccupancy) {
                await handleUpdateOccupancy(selectedOccupancy.id, {
                  occupancy_type: values.occupancy_type,
                  start_date: format(values.start_date, 'yyyy-MM-dd'),
                  end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
                  tenant_name: values.tenant_name,
                  notes: values.notes,
                  contract_id: values.contract_id,
                });
              }
            })} className="space-y-4">
              <FormField
                control={form.control}
                name="occupancy_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Ocupação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rented">Alugado</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="vacant">Vazio</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="owner_occupied">Proprietário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <DatePicker
                        onSelect={field.onChange}
                        defaultMonth={field.value}
                        selected={field.value}
                        mode="single"
                      />
                    </FormControl>
                    <FormDescription>
                      Selecione a data de início da ocupação.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim (Opcional)</FormLabel>
                    <FormControl>
                      <DatePicker
                        onSelect={field.onChange}
                        defaultMonth={field.value}
                        selected={field.value}
                        mode="single"
                      />
                    </FormControl>
                    <FormDescription>
                      Selecione a data de fim da ocupação, se aplicável.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Inquilino (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do inquilino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Contrato (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ID do contrato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCloseEditOccupancy}>Cancelar</AlertDialogCancel>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Occupancy Dialog */}
      <AlertDialog open={isEndingOccupancy} onOpenChange={setIsEndingOccupancy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Período de Ocupação</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione a data de fim para o período de ocupação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="endingDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                Data de Fim
              </label>
              <DatePicker
                id="endingDate"
                mode="single"
                selected={endingDate}
                onSelect={setEndingDate}
                className="w-full rounded-md border ring-offset-background focus:ring-ring focus:ring-2 focus:outline-none data-[state=open]:bg-popover data-[state=open]:text-popover-foreground"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseEndOccupancy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEndOccupancy} disabled={isUpdating}>
              {isUpdating ? 'Finalizando...' : 'Finalizar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
