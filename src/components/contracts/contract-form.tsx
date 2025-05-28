import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProperties } from '@/hooks/use-properties';
import { ContractFormData, ContractStatus, SignatureStatus, VariableRentValue } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Plus, CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency, parseCurrencyToNumber, formatDate, parseDate, isValidDateFormat } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { VariableRentInput } from './variable-rent-input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Form validation schema
const contractFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  property_id: z.string().optional().nullable(),
  tenant_name: z.string().min(3, 'Nome do inquilino deve ter pelo menos 3 caracteres'),
  tenant_document: z.string().optional().nullable(),
  tenant_contact: z.string().optional().nullable(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de término é obrigatória'),
  value: z.number().positive('Valor deve ser positivo'),
  payment_day: z.number().min(1, 'Dia deve estar entre 1 e 31').max(31, 'Dia deve estar entre 1 e 31'),
  payment_due_day: z.number().min(1, 'Dia deve estar entre 1 e 31').max(31, 'Dia deve estar entre 1 e 31'),
  deposit_value: z.number().optional().nullable(),
  status: z.string(),
  terms: z.string().optional().nullable(),
  has_renewal_option: z.boolean().default(false).optional(),
  renewal_terms: z.string().optional().nullable(),
  special_conditions: z.string().optional().nullable(),
  has_variable_rent: z.boolean().default(false).optional(),
  on_time_discount_percentage: z.number().min(0).max(100).optional().nullable(),
  late_fee_percentage: z.number().min(0).max(100).optional().nullable(),
  is_discount_not_fee: z.boolean().default(true).optional(),
  late_interest_percentage: z.number().min(0).max(100).optional().nullable(),
  late_daily_interest: z.number().min(0).max(100).optional().nullable(),
  fine_percentage: z.number().min(0).max(100).optional().nullable(),
  payment_terms: z.string().optional().nullable(),
});

type ContractFormProps = {
  initialData?: any;
  onSubmit: (data: ContractFormData, documentFile?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ContractForm({ initialData, onSubmit, onCancel, isLoading }: ContractFormProps) {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const { properties, isLoading: isLoadingProperties } = useProperties();
  
  // State for variable rent values
  const [variableRentValues, setVariableRentValues] = useState<VariableRentValue[]>(
    initialData?.variable_rent_values || []
  );
  
  // Initialize the form with default values or initial data
  const form = useForm<z.infer<typeof contractFormSchema>>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      property_id: initialData?.property_id || null,
      tenant_name: initialData?.tenant_name || '',
      tenant_document: initialData?.tenant_document || '',
      tenant_contact: initialData?.tenant_contact || '',
      start_date: initialData?.start_date ? formatDate(initialData.start_date) : format(new Date(), 'dd/MM/yyyy'),
      end_date: initialData?.end_date ? formatDate(initialData.end_date) : format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'dd/MM/yyyy'),
      value: initialData?.value || 0,
      payment_day: initialData?.payment_day || 5,
      payment_due_day: initialData?.payment_due_day || 10,
      deposit_value: initialData?.deposit_value || null,
      status: initialData?.status || 'draft',
      terms: initialData?.terms || '',
      has_renewal_option: initialData?.has_renewal_option || false,
      renewal_terms: initialData?.renewal_terms || '',
      special_conditions: initialData?.special_conditions || '',
      has_variable_rent: initialData?.has_variable_rent || false,
      on_time_discount_percentage: initialData?.on_time_discount_percentage || 0,
      late_fee_percentage: initialData?.late_fee_percentage || 0,
      is_discount_not_fee: initialData?.is_discount_not_fee !== undefined ? initialData.is_discount_not_fee : true,
      late_interest_percentage: initialData?.late_interest_percentage || 0,
      late_daily_interest: initialData?.late_daily_interest || 0,
      fine_percentage: initialData?.fine_percentage || 0,
      payment_terms: initialData?.payment_terms || '',
    },
  });

  // Update property fields when property selection changes
  const selectedPropertyId = form.watch('property_id');
  useEffect(() => {
    if (selectedPropertyId) {
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      if (selectedProperty) {
        // Auto-fill tenant information if available
        if (selectedProperty.tenant_name) {
          form.setValue('tenant_name', selectedProperty.tenant_name);
        }
        if (selectedProperty.tenant_contact) {
          form.setValue('tenant_contact', selectedProperty.tenant_contact);
        }
      }
    }
  }, [selectedPropertyId, properties, form]);

  // Handle form submission
  async function handleFormSubmit(data: z.infer<typeof contractFormSchema>) {
    // Format the form data for submission
    const formattedData: ContractFormData = {
      title: data.title,
      property_id: data.property_id,
      tenant_name: data.tenant_name,
      tenant_document: data.tenant_document,
      tenant_contact: data.tenant_contact,
      // Parse dates from dd/mm/yyyy to ISO format
      start_date: parseDate(data.start_date),
      end_date: parseDate(data.end_date),
      value: data.value,
      payment_day: data.payment_day,
      payment_due_day: data.payment_due_day,
      deposit_value: data.deposit_value,
      status: data.status as ContractStatus,
      terms: data.terms,
      has_renewal_option: data.has_renewal_option,
      renewal_terms: data.renewal_terms,
      special_conditions: data.special_conditions,
      has_variable_rent: data.has_variable_rent,
      variable_rent_values: data.has_variable_rent ? variableRentValues : [],
      on_time_discount_percentage: data.on_time_discount_percentage,
      late_fee_percentage: data.late_fee_percentage,
      is_discount_not_fee: data.is_discount_not_fee,
      late_interest_percentage: data.late_interest_percentage,
      late_daily_interest: data.late_daily_interest,
      fine_percentage: data.fine_percentage,
      payment_terms: data.payment_terms,
    };

    await onSubmit(formattedData, documentFile || undefined);
  }

  // Handle document file changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  // Simple currency input handler
  const handleCurrencyInput = (value: string, onChange: (val: number) => void) => {
    // Remove all non-numeric characters except comma and dot
    const cleanValue = value.replace(/[^\d,.]/g, '');
    
    // Convert to number and update form
    const numericValue = parseCurrencyToNumber(cleanValue);
    onChange(numericValue);
  };

  // Format currency on blur
  const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>, field: any) => {
    const value = parseCurrencyToNumber(e.target.value);
    field.onChange(value);
    e.target.value = formatCurrency(value);
  };

  // Format percentage on blur
  const handlePercentageBlur = (e: React.FocusEvent<HTMLInputElement>, field: any) => {
    const value = parseFloat(e.target.value.replace('%', '').replace(',', '.'));
    field.onChange(isNaN(value) ? 0 : value);
    e.target.value = `${isNaN(value) ? 0 : value.toFixed(2).replace('.', ',')}%`;
  };

  // Validate date format on blur
  const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value;
    if (!isValidDateFormat(value)) {
      // If invalid, revert to the current value or empty
      e.target.value = field.value || '';
      return;
    }
    field.onChange(value);
  };

  // Update property data when contract is active
  const updatePropertyData = (propertyId: string | null | undefined, tenant: string, tenantContact: string | null | undefined) => {
    if (propertyId && form.watch('status') === 'active') {
      // Logic to update property data will be implemented in the API
      console.log('Updating property with tenant data:', {
        propertyId,
        tenant,
        tenantContact
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (data) => {
        const formattedData: ContractFormData = {
          title: data.title,
          property_id: data.property_id,
          tenant_name: data.tenant_name,
          tenant_document: data.tenant_document,
          tenant_contact: data.tenant_contact,
          start_date: parseDate(data.start_date),
          end_date: parseDate(data.end_date),
          value: data.value,
          payment_day: data.payment_day,
          payment_due_day: data.payment_due_day,
          deposit_value: data.deposit_value,
          status: data.status as ContractStatus,
          terms: data.terms,
          has_renewal_option: data.has_renewal_option,
          renewal_terms: data.renewal_terms,
          special_conditions: data.special_conditions,
          has_variable_rent: data.has_variable_rent,
          variable_rent_values: data.has_variable_rent ? variableRentValues : [],
          on_time_discount_percentage: data.on_time_discount_percentage,
          late_fee_percentage: data.late_fee_percentage,
          is_discount_not_fee: data.is_discount_not_fee,
          late_interest_percentage: data.late_interest_percentage,
          late_daily_interest: data.late_daily_interest,
          fine_percentage: data.fine_percentage,
          payment_terms: data.payment_terms,
        };

        await onSubmit(formattedData, documentFile || undefined);
      })} className="space-y-6">
        {/* Basic Contract Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Contrato</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do contrato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imóvel</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        disabled={isLoadingProperties}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um imóvel" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingProperties ? (
                            <SelectItem value="loading" disabled>
                              Carregando imóveis...
                            </SelectItem>
                          ) : (
                            properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Imóvel relacionado a este contrato
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tenant Information */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Informações do Inquilino</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tenant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Inquilino</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenant_document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento (CPF/CNPJ)</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF ou CNPJ" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenant_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefone ou email" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contract Terms */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Termos do Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="dd/mm/aaaa" 
                          {...field} 
                          onBlur={(e) => handleDateBlur(e, field)}
                        />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>Formato: dd/mm/aaaa</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Término</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="dd/mm/aaaa" 
                          {...field} 
                          onBlur={(e) => handleDateBlur(e, field)}
                        />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>Formato: dd/mm/aaaa</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="has_variable_rent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Valor variado de aluguel</FormLabel>
                      <FormDescription>
                        O contrato tem valores diferentes ao longo dos meses
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch('has_variable_rent') && (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Aluguel (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="R$ 0,00"
                          defaultValue={field.value ? formatCurrency(field.value) : ''}
                          onChange={(e) => handleCurrencyInput(e.target.value, field.onChange)}
                          onBlur={(e) => {
                            const numericValue = parseCurrencyToNumber(e.target.value);
                            field.onChange(numericValue);
                            e.target.value = formatCurrency(numericValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('has_variable_rent') && (
                <div className="col-span-2">
                  <VariableRentInput 
                    values={variableRentValues}
                    onChange={(values) => setVariableRentValues(values)}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="deposit_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Depósito (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Opcional" 
                        value={field.value !== null ? formatCurrency(field.value) : ''} 
                        onChange={(e) => {
                          // Allow typing, will format on blur
                          const rawValue = e.target.value.replace(/[^\d,]/g, '');
                          e.target.value = rawValue;
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            handleCurrencyBlur(e, field);
                          } else {
                            field.onChange(null);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Contrato</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // If status is set to active, update property with tenant info
                        if (value === 'active') {
                          updatePropertyData(
                            form.getValues('property_id'),
                            form.getValues('tenant_name'),
                            form.getValues('tenant_contact')
                          );
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Condições de Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="payment_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Pagamento</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" {...field} />
                    </FormControl>
                    <FormDescription>Dia do mês para pagamento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_due_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" {...field} />
                    </FormControl>
                    <FormDescription>Dia do mês para vencimento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_discount_not_fee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {field.value ? "Desconto para pagamento em dia" : "Juros para atraso"}
                      </FormLabel>
                      <FormDescription>
                        Alternar entre desconto e juros
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('is_discount_not_fee') ? (
                <FormField
                  control={form.control}
                  name="on_time_discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto para Pagamento em Dia (%)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0%" 
                          value={`${field.value || 0}%`}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d,]/g, '');
                            field.onChange(parseFloat(value.replace(',', '.')) || 0);
                          }}
                          onBlur={(e) => handlePercentageBlur(e, field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="late_fee_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Juros para Pagamento em Atraso (%)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0%" 
                          value={`${field.value || 0}%`}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d,]/g, '');
                            field.onChange(parseFloat(value.replace(',', '.')) || 0);
                          }}
                          onBlur={(e) => handlePercentageBlur(e, field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Late Payment Terms */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Condições para Atraso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="late_interest_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juros de Mora (%)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0%" 
                        value={`${field.value || 0}%`}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          field.onChange(parseFloat(value.replace(',', '.')) || 0);
                        }}
                        onBlur={(e) => handlePercentageBlur(e, field)}
                      />
                    </FormControl>
                    <FormDescription>Juros mensais por atraso</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="late_daily_interest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juros Diários (%)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0%" 
                        value={`${field.value || 0}%`}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          field.onChange(parseFloat(value.replace(',', '.')) || 0);
                        }}
                        onBlur={(e) => handlePercentageBlur(e, field)}
                      />
                    </FormControl>
                    <FormDescription>Juros diários por atraso</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fine_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Multa (%)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0%" 
                        value={`${field.value || 0}%`}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          field.onChange(parseFloat(value.replace(',', '.')) || 0);
                        }}
                        onBlur={(e) => handlePercentageBlur(e, field)}
                      />
                    </FormControl>
                    <FormDescription>Multa por atraso</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Termos de Pagamento Adicionais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Condições específicas de pagamento"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Contract Terms */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Termos Adicionais</h3>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termos e Condições</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Termos gerais do contrato"
                        className="min-h-[150px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="has_renewal_option"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Opção de Renovação</FormLabel>
                      <FormDescription>
                        O contrato inclui opção de renovação?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('has_renewal_option') && (
                <FormField
                  control={form.control}
                  name="renewal_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termos de Renovação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Termos específicos para renovação"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="special_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condições Especiais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Condições especiais ou observações"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Documentos do Contrato</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FormLabel>Contrato Assinado (PDF)</FormLabel>
                  <div className="mt-2">
                    <label className="flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg border border-dashed border-gray-300 tracking-wide cursor-pointer hover:bg-gray-50 transition-colors">
                      <FileText className="w-8 h-8 text-gray-500" />
                      <span className="mt-2 text-base leading-normal">
                        {documentFile 
                          ? `Arquivo selecionado: ${documentFile.name}` 
                          : initialData?.document_url
                            ? 'Contrato já anexado. Escolha um novo arquivo para substituir.'
                            : 'Selecione um arquivo'
                        }
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                    {initialData?.document_url && !documentFile && (
                      <div className="mt-2 flex">
                        <a 
                          href={initialData.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Ver documento atual
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Arquivos suportados: PDF, DOC, DOCX
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Atualizar Contrato' : 'Criar Contrato'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
