
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, FileText, Users, DollarSign, AlertCircle } from 'lucide-react';
import { ContractFormData } from '@/types/contract';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { formatCurrency } from '@/utils/currency';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';

const contractSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  property_id: z.string().min(1, { message: 'Selecione um imóvel.' }),
  tenant_name: z.string().min(3, { message: 'O nome do inquilino deve ter pelo menos 3 caracteres.' }),
  start_date: z.string().min(1, { message: 'Selecione a data de início.' }),
  end_date: z.string().min(1, { message: 'Selecione a data de término.' }),
  value: z.number({ invalid_type_error: 'O valor deve ser um número.' }).gt(0, { message: 'O valor deve ser maior que zero.' }),
  payment_day: z.number({ invalid_type_error: 'O dia do pagamento deve ser um número.' }).min(1).max(31, { message: 'O dia do pagamento deve estar entre 1 e 31.' }),
  status: z.enum(['active', 'inactive', 'finished']),
  terms: z.string().optional(),
});

interface ContractFormProps {
  initialData?: Partial<ContractFormData>;
  onSubmit: (data: ContractFormData, documentFile?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { properties } = useProperties();
  const { contracts } = useContracts();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<{
    show: boolean;
    message: string;
    conflictingContracts: any[];
  }>({
    show: false,
    message: '',
    conflictingContracts: []
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: '',
      property_id: '',
      tenant_name: '',
      start_date: '',
      end_date: '',
      value: 0,
      payment_day: 5,
      status: 'active',
      ...initialData
    }
  });

  const watchedPropertyId = form.watch('property_id');
  const watchedStartDate = form.watch('start_date');
  const watchedEndDate = form.watch('end_date');

  // Filter properties based on availability
  const filteredProperties = showOnlyAvailable 
    ? properties.filter(property => property.status !== 'rented')
    : properties;

  // Check for contract conflicts
  useEffect(() => {
    if (watchedPropertyId && watchedStartDate && watchedEndDate) {
      const startDate = new Date(watchedStartDate);
      const endDate = new Date(watchedEndDate);
      
      const conflictingContracts = contracts.filter(contract => {
        // Skip if it's the same contract being edited
        if (initialData && 'id' in initialData && contract.id === initialData.id) {
          return false;
        }
        
        if (contract.property_id !== watchedPropertyId) {
          return false;
        }
        
        const contractStart = new Date(contract.start_date);
        const contractEnd = new Date(contract.end_date);
        
        // Check for date overlap
        return (startDate <= contractEnd && endDate >= contractStart);
      });

      if (conflictingContracts.length > 0) {
        setConflictWarning({
          show: true,
          message: `Existe${conflictingContracts.length > 1 ? 'm' : ''} ${conflictingContracts.length} contrato${conflictingContracts.length > 1 ? 's' : ''} ativo${conflictingContracts.length > 1 ? 's' : ''} com datas sobrepostas.`,
          conflictingContracts
        });
      } else {
        setConflictWarning({ show: false, message: '', conflictingContracts: [] });
      }
    }
  }, [watchedPropertyId, watchedStartDate, watchedEndDate, contracts, initialData]);

  const handleSubmit = async (data: ContractFormData) => {
    // If there are conflicts, show warning dialog first
    if (conflictWarning.show && conflictWarning.conflictingContracts.length > 0) {
      return; // Let user handle the conflict warning first
    }
    
    await onSubmit(data, documentFile || undefined);
  };

  const handleConflictConfirm = async () => {
    const data = form.getValues();
    setConflictWarning({ show: false, message: '', conflictingContracts: [] });
    await onSubmit(data, documentFile || undefined);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Imóvel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="showOnlyAvailable"
                checked={showOnlyAvailable}
                onCheckedChange={(checked) => setShowOnlyAvailable(checked === true)}
              />
              <Label htmlFor="showOnlyAvailable" className="text-sm">
                Mostrar apenas imóveis disponíveis
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Imóvel *</Label>
              <Select
                value={form.watch('property_id')}
                onValueChange={(value) => form.setValue('property_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} - {property.address}
                      {property.status === 'rented' && ' (Ocupado)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.property_id && (
                <p className="text-red-500 text-sm">{form.formState.errors.property_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Contrato *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Ex: Contrato de Locação - Apartamento Centro"
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conflict Warning */}
        {conflictWarning.show && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <p className="font-medium">{conflictWarning.message}</p>
              </div>
              <div className="mt-2 text-sm text-yellow-700">
                {conflictWarning.conflictingContracts.map((contract, index) => (
                  <p key={index}>
                    • {contract.tenant_name} ({format(new Date(contract.start_date), 'dd/MM/yyyy')} - {format(new Date(contract.end_date), 'dd/MM/yyyy')})
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tenant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações do Inquilino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_name">Nome do Inquilino *</Label>
              <Input
                id="tenant_name"
                {...form.register('tenant_name')}
                placeholder="Nome completo do inquilino"
              />
              {form.formState.errors.tenant_name && (
                <p className="text-red-500 text-sm">{form.formState.errors.tenant_name.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contract Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Datas do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <DatePicker
                date={form.watch('start_date') ? new Date(form.watch('start_date')) : undefined}
                onSelect={(date) => form.setValue('start_date', date ? format(date, 'yyyy-MM-dd') : '')}
              />
              {form.formState.errors.start_date && (
                <p className="text-red-500 text-sm">{form.formState.errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término *</Label>
              <DatePicker
                date={form.watch('end_date') ? new Date(form.watch('end_date')) : undefined}
                onSelect={(date) => form.setValue('end_date', date ? format(date, 'yyyy-MM-dd') : '')}
              />
              {form.formState.errors.end_date && (
                <p className="text-red-500 text-sm">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalhes Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor do Aluguel *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                {...form.register('value', { valueAsNumber: true })}
                placeholder="Valor mensal do aluguel"
              />
              {form.formState.errors.value && (
                <p className="text-red-500 text-sm">{form.formState.errors.value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_day">Dia do Pagamento *</Label>
              <Input
                id="payment_day"
                type="number"
                {...form.register('payment_day', { valueAsNumber: true })}
                placeholder="Dia do mês para pagamento"
              />
              {form.formState.errors.payment_day && (
                <p className="text-red-500 text-sm">{form.formState.errors.payment_day.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms">Termos e Condições</Label>
              <Textarea
                id="terms"
                {...form.register('terms')}
                placeholder="Observações sobre o contrato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Anexar Documento</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setDocumentFile(e.target.files[0]);
                  } else {
                    setDocumentFile(null);
                  }
                }}
              />
              {documentFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {documentFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status do Contrato</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value: 'active' | 'inactive' | 'finished') => form.setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="finished">Finalizado</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : (initialData && 'id' in initialData ? 'Atualizar' : 'Criar') + ' Contrato'}
          </Button>
        </div>
      </form>

      {/* Conflict Confirmation Dialog */}
      <Dialog open={conflictWarning.show && conflictWarning.conflictingContracts.length > 0} onOpenChange={() => setConflictWarning({ show: false, message: '', conflictingContracts: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conflito de Datas Detectado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>{conflictWarning.message}</p>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Contratos em conflito:</p>
              {conflictWarning.conflictingContracts.map((contract, index) => (
                <p key={index}>
                  • {contract.tenant_name} ({format(new Date(contract.start_date), 'dd/MM/yyyy')} - {format(new Date(contract.end_date), 'dd/MM/yyyy')})
                </p>
              ))}
            </div>
            <p className="text-sm">Deseja criar o contrato mesmo assim?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictWarning({ show: false, message: '', conflictingContracts: [] })}>
              Cancelar
            </Button>
            <Button onClick={handleConflictConfirm}>
              Criar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
