import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { ContractFormData } from '@/types/contract';
import { toast } from 'sonner';

const contractSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  property_id: z.string().min(1, 'Propriedade é obrigatória'),
  tenant_name: z.string().min(1, 'Nome do inquilino é obrigatório'),
  tenant_contact: z.string().optional(),
  tenant_document: z.string().optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de fim é obrigatória'),
  value: z.number().min(0.01, 'Valor deve ser maior que zero'),
  payment_day: z.number().min(1).max(31),
  deposit_value: z.number().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  terms: z.string().optional(),
  special_conditions: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

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
  isLoading = false,
}) => {
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictData, setConflictData] = useState<ContractFormValues | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  
  const { properties } = useProperties();
  const { contracts } = useContracts();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: initialData?.title || '',
      property_id: initialData?.property_id || '',
      tenant_name: initialData?.tenant_name || '',
      tenant_contact: initialData?.tenant_contact || '',
      tenant_document: initialData?.tenant_document || '',
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      value: initialData?.value || 0,
      payment_day: initialData?.payment_day || 5,
      deposit_value: initialData?.deposit_value || 0,
      status: initialData?.status || 'active',
      terms: initialData?.terms || '',
      special_conditions: initialData?.special_conditions || '',
    },
  });

  // Filter properties based on availability
  const filteredProperties = properties.filter(property => {
    if (!showOnlyAvailable) return true;
    return property.status === 'available';
  });

  const checkForConflicts = (data: ContractFormValues): boolean => {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    const conflictingContracts = contracts.filter(contract => {
      if (contract.property_id !== data.property_id) return false;
      if (contract.status !== 'active') return false;
      if (initialData?.id && contract.id === initialData.id) return false; // Skip self when editing
      
      const contractStart = new Date(contract.start_date);
      const contractEnd = new Date(contract.end_date);
      
      // Check for date overlap
      return (startDate <= contractEnd && endDate >= contractStart);
    });
    
    return conflictingContracts.length > 0;
  };

  const handleSubmit = async (data: ContractFormValues) => {
    // Check for conflicts only if creating new contract
    if (!initialData?.id && checkForConflicts(data)) {
      setConflictData(data);
      setConflictDialogOpen(true);
      return;
    }
    
    await proceedWithSubmit(data);
  };

  const proceedWithSubmit = async (data: ContractFormValues) => {
    try {
      await onSubmit(data as ContractFormData, documentFile || undefined);
    } catch (error) {
      console.error('Error submitting contract:', error);
      toast.error('Erro ao salvar contrato');
    }
  };

  const handleConflictConfirm = async () => {
    if (conflictData) {
      await proceedWithSubmit(conflictData);
    }
    setConflictDialogOpen(false);
    setConflictData(null);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Contrato</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Ex: Contrato de Locação - Apartamento 101"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="property_id">Propriedade</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-only-available"
                      checked={showOnlyAvailable}
                      onCheckedChange={setShowOnlyAvailable}
                    />
                    <Label htmlFor="show-only-available" className="text-xs text-muted-foreground">
                      Apenas disponíveis
                    </Label>
                  </div>
                </div>
                <Select
                  value={form.watch('property_id')}
                  onValueChange={(value) => form.setValue('property_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} {property.status !== 'available' && `(${property.status})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.property_id && (
                  <p className="text-sm text-red-500">{form.formState.errors.property_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant_name">Nome do Inquilino</Label>
                <Input
                  id="tenant_name"
                  {...form.register('tenant_name')}
                  placeholder="Nome completo"
                />
                {form.formState.errors.tenant_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.tenant_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_contact">Contato</Label>
                <Input
                  id="tenant_contact"
                  {...form.register('tenant_contact')}
                  placeholder="Telefone ou email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_document">Documento</Label>
                <Input
                  id="tenant_document"
                  {...form.register('tenant_document')}
                  placeholder="CPF ou CNPJ"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  type="date"
                  id="start_date"
                  {...form.register('start_date')}
                />
                {form.formState.errors.start_date && (
                  <p className="text-sm text-red-500">{form.formState.errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Fim</Label>
                <Input
                  type="date"
                  id="end_date"
                  {...form.register('end_date')}
                />
                {form.formState.errors.end_date && (
                  <p className="text-sm text-red-500">{form.formState.errors.end_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valor do Aluguel</Label>
                <Input
                  type="number"
                  id="value"
                  {...form.register('value', { valueAsNumber: true })}
                  placeholder="R$ 0,00"
                />
                {form.formState.errors.value && (
                  <p className="text-sm text-red-500">{form.formState.errors.value.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_day">Dia do Pagamento</Label>
                <Input
                  type="number"
                  id="payment_day"
                  {...form.register('payment_day', { valueAsNumber: true })}
                  placeholder="Ex: 5"
                />
                {form.formState.errors.payment_day && (
                  <p className="text-sm text-red-500">{form.formState.errors.payment_day.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_value">Valor do Depósito</Label>
                <Input
                  type="number"
                  id="deposit_value"
                  {...form.register('deposit_value', { valueAsNumber: true })}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status do Contrato</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="terminated">Terminado</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Termos e Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms">Termos</Label>
              <Textarea
                id="terms"
                {...form.register('terms')}
                placeholder="Termos e condições gerais do contrato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_conditions">Condições Especiais</Label>
              <Textarea
                id="special_conditions"
                {...form.register('special_conditions')}
                placeholder="Condições especiais ou adicionais ao contrato"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documento do Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setDocumentFile(e.target.files[0]);
                }
              }}
            />
            {documentFile && (
              <p className="mt-2 text-sm text-muted-foreground">
                Arquivo selecionado: {documentFile.name}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : initialData?.id ? 'Atualizar' : 'Criar Contrato'}
          </Button>
        </div>
      </form>

      {/* Conflict Dialog */}
      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conflito de Datas Detectado</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um contrato ativo para esta propriedade no período selecionado. 
              Deseja continuar e criar um novo contrato mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConflictConfirm}>
              Criar Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
