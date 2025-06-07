import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { MaskedDateInput, convertToISODate, convertFromISODate } from '@/components/ui/masked-date-input';
import { CommissionInput } from '@/components/contracts/commission-input';
import { ContractFormRentField } from '@/components/contracts/contract-form-rent-field';
import { ContractFormData, Contract } from '@/types/contract';
import { useProperties } from '@/hooks/use-properties';
import { FileUpload } from '@/components/ui/file-upload';

const adjustmentIndexOptions = [
  'IGP-DI',
  'IGP-M', 
  'IPCA',
  'INPC',
  'IVAR',
  'IPC',
  'IPC-DI'
];

const contractSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  property_id: z.string().optional(),
  tenant_name: z.string().min(1, 'Nome do inquilino é obrigatório'),
  tenant_contact: z.string().optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de término é obrigatória'),
  value: z.number().min(0, 'Valor deve ser positivo'),
  payment_day: z.number().min(1).max(31),
  deposit_value: z.number().optional(),
  status: z.enum(['active', 'pending', 'expired', 'canceled', 'draft']),
  terms: z.string().optional(),
  has_renewal_option: z.boolean().optional(),
  renewal_terms: z.string().optional(),
  special_conditions: z.string().optional(),
  // Novos campos
  adjustment_index: z.string().optional(),
  adjustment_date: z.string().optional(),
  agency_name: z.string().optional(),
  agency_contact: z.string().optional(),
  agency_responsible_name: z.string().optional(),
  agency_responsible_contact: z.string().optional(),
  commission_type: z.enum(['percentage', 'monetary']).optional(),
  commission_value: z.number().optional(),
});

interface ContractFormProps {
  initialData?: Partial<Contract>;
  onSubmit: (data: ContractFormData, documentFile?: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContractForm({ initialData, onSubmit, onCancel, isLoading = false }: ContractFormProps) {
  const { properties } = useProperties();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  
  // Estado para datas em formato brasileiro
  const [startDateBR, setStartDateBR] = useState('');
  const [endDateBR, setEndDateBR] = useState('');
  const [adjustmentDateBR, setAdjustmentDateBR] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      status: 'active',
      payment_day: 5,
      commission_type: 'percentage',
      commission_value: 0,
      ...initialData,
    },
  });

  // Converter datas do formato ISO para brasileiro quando carregar dados iniciais
  useEffect(() => {
    if (initialData?.start_date) {
      setStartDateBR(convertFromISODate(initialData.start_date));
    }
    if (initialData?.end_date) {
      setEndDateBR(convertFromISODate(initialData.end_date));
    }
    if (initialData?.adjustment_date) {
      setAdjustmentDateBR(convertFromISODate(initialData.adjustment_date));
    }
  }, [initialData]);

  const hasRenewal = watch('has_renewal_option');
  const commissionType = watch('commission_type') || 'percentage';
  const commissionValue = watch('commission_value') || 0;

  const handleFormSubmit = (data: ContractFormData) => {
    // Converter as datas do formato brasileiro para ISO antes de enviar
    const formattedData = {
      ...data,
      start_date: convertToISODate(startDateBR),
      end_date: convertToISODate(endDateBR),
      adjustment_date: adjustmentDateBR ? convertToISODate(adjustmentDateBR) : undefined,
    };

    onSubmit(formattedData, documentFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Informações gerais do contrato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título do Contrato *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ex: Contrato de Locação - Apt 101"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="property_id">Propriedade</Label>
              <Select
                value={watch('property_id') || ''}
                onValueChange={(value) => setValue('property_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma propriedade" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} - {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <MaskedDateInput
                value={startDateBR}
                onChange={setStartDateBR}
                required
              />
              {errors.start_date && (
                <p className="text-sm text-red-500 mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <Label>Data de Término *</Label>
              <MaskedDateInput
                value={endDateBR}
                onChange={setEndDateBR}
                required
              />
              {errors.end_date && (
                <p className="text-sm text-red-500 mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Inquilino */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Inquilino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tenant_name">Nome do Inquilino *</Label>
              <Input
                id="tenant_name"
                {...register('tenant_name')}
                placeholder="Nome completo do inquilino"
              />
              {errors.tenant_name && (
                <p className="text-sm text-red-500 mt-1">{errors.tenant_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tenant_contact">Contato do Inquilino</Label>
              <Input
                id="tenant_contact"
                {...register('tenant_contact')}
                placeholder="Telefone ou email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Imobiliária */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Imobiliária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agency_name">Nome da Imobiliária</Label>
              <Input
                id="agency_name"
                {...register('agency_name')}
                placeholder="Nome da imobiliária"
              />
            </div>

            <div>
              <Label htmlFor="agency_contact">Contato da Imobiliária</Label>
              <Input
                id="agency_contact"
                {...register('agency_contact')}
                placeholder="Telefone ou email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agency_responsible_name">Nome do Responsável</Label>
              <Input
                id="agency_responsible_name"
                {...register('agency_responsible_name')}
                placeholder="Nome do responsável pelo contato"
              />
            </div>

            <div>
              <Label htmlFor="agency_responsible_contact">Contato do Responsável</Label>
              <Input
                id="agency_responsible_contact"
                {...register('agency_responsible_contact')}
                placeholder="Telefone ou email do responsável"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes Financeiros */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes Financeiros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContractFormRentField
            value={watch('value')}
            onChange={(value) => setValue('value', value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="payment_day">Dia do Pagamento</Label>
              <Input
                id="payment_day"
                type="number"
                min="1"
                max="31"
                {...register('payment_day', { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="deposit_value">Valor do Depósito</Label>
              <CurrencyInput
                value={watch('deposit_value') || 0}
                onValueChange={(value) => setValue('deposit_value', value || 0)}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <CommissionInput
            commissionType={commissionType}
            commissionValue={commissionValue}
            onCommissionTypeChange={(type) => setValue('commission_type', type)}
            onCommissionValueChange={(value) => setValue('commission_value', value)}
          />
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adjustment_index">Índice de Reajuste</Label>
              <Select
                value={watch('adjustment_index') || ''}
                onValueChange={(value) => setValue('adjustment_index', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o índice" />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentIndexOptions.map((index) => (
                    <SelectItem key={index} value={index}>
                      {index}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Reajuste</Label>
              <MaskedDateInput
                value={adjustmentDateBR}
                onChange={setAdjustmentDateBR}
                placeholder="dd/mm/aaaa"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="terms">Termos e Condições</Label>
            <Textarea
              id="terms"
              {...register('terms')}
              placeholder="Termos adicionais do contrato..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_renewal_option"
              checked={hasRenewal}
              onCheckedChange={(checked) => setValue('has_renewal_option', checked as boolean)}
            />
            <Label htmlFor="has_renewal_option">Opção de renovação</Label>
          </div>

          {hasRenewal && (
            <div>
              <Label htmlFor="renewal_terms">Termos de Renovação</Label>
              <Textarea
                id="renewal_terms"
                {...register('renewal_terms')}
                placeholder="Condições para renovação do contrato..."
                rows={3}
              />
            </div>
          )}

          <div>
            <Label htmlFor="special_conditions">Condições Especiais</Label>
            <Textarea
              id="special_conditions"
              {...register('special_conditions')}
              placeholder="Condições especiais do contrato..."
              rows={3}
            />
          </div>

          <div>
            <Label>Anexar Documento</Label>
            <FileUpload
              onFileSelect={setDocumentFile}
              accept=".pdf,.doc,.docx"
              maxSizeMB={10}
            />
            {documentFile && (
              <p className="text-sm text-green-600 mt-1">
                Arquivo selecionado: {documentFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Contrato'}
        </Button>
      </div>
    </form>
  );
}
