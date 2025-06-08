
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, Receipt, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Contract, ContractStatus, VariableRentValue, RecurringTransaction } from '@/types/contract';
import { useContracts } from '@/hooks/use-contracts';
import { ContractAdjustmentForm } from './contract-adjustment-form';
import { ContractAdjustmentHistory } from './contract-adjustment-history';
import { CommissionInput } from './commission-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useProperties } from '@/hooks/use-properties';
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from 'react';
import { MaskedDateInput, convertToISODate, convertFromISODate } from '@/components/ui/masked-date-input';

interface ContractFormEnhancedProps {
  initialData?: Contract | null;
  onSuccess: (contractId: string) => void;
  onCancel: () => void;
}

const adjustmentIndexOptions = [
  { value: 'igp-m', label: 'IGP-M' },
  { value: 'ipca', label: 'IPCA' },
  { value: 'inpc', label: 'INPC' },
  { value: 'ipc-fipe', label: 'IPC-FIPE' },
  { value: 'custom', label: 'Personalizado' },
];

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres."),
  property_id: z.string().nullable(),
  tenant_name: z.string().min(3, "Nome do inquilino deve ter pelo menos 3 caracteres."),
  tenant_document: z.string().nullable(),
  tenant_contact: z.string().nullable(),
  start_date: z.string().min(10, "Data de início é obrigatória"),
  end_date: z.string().min(10, "Data de término é obrigatória"),
  value: z.number().min(0, "Valor deve ser positivo"),
  payment_day: z.number().min(1).max(31),
  deposit_value: z.number().nullable(),
  status: z.enum(['active', 'pending', 'expired', 'canceled', 'draft']),
  terms: z.string().nullable(),
  has_renewal_option: z.boolean().nullable(),
  renewal_terms: z.string().nullable(),
  special_conditions: z.string().nullable(),
  has_variable_rent: z.boolean().nullable(),
  variable_rent_values: z.array(
    z.object({
      month: z.number(),
      year: z.number(),
      value: z.number(),
      applyUntilEnd: z.boolean().optional(),
    })
  ).nullable(),
  payment_due_day: z.number().nullable(),
  on_time_discount_percentage: z.number().nullable(),
  late_fee_percentage: z.number().nullable(),
  is_discount_not_fee: z.boolean().nullable(),
  late_interest_percentage: z.number().nullable(),
  late_daily_interest: z.number().nullable(),
  fine_percentage: z.number().nullable(),
  payment_terms: z.string().nullable(),
  adjustment_index: z.string().nullable(),
  adjustment_date: z.string().nullable(),
  agency_name: z.string().nullable(),
  agency_contact: z.string().nullable(),
  agency_responsible_name: z.string().nullable(),
  agency_responsible_contact: z.string().nullable(),
  commission_type: z.string().nullable(),
  commission_value: z.number().nullable(),
  recurring_transactions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['income', 'expense']),
      name: z.string(),
      amount: z.number(),
      category: z.string(),
      frequency: z.enum(['monthly', 'quarterly', 'annually']),
      start_date: z.string(),
      end_date: z.string().optional(),
    })
  ).nullable(),
})

export function ContractFormEnhanced({ 
  initialData, 
  onSuccess, 
  onCancel 
}: ContractFormEnhancedProps) {
  const { createContract, updateContract, isCreatingContract, isUpdatingContract } = useContracts();
  const { properties } = useProperties();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(
    initialData?.recurring_transactions || []
  );
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      property_id: initialData?.property_id || null,
      tenant_name: initialData?.tenant_name || '',
      tenant_document: initialData?.tenant_document || null,
      tenant_contact: initialData?.tenant_contact || null,
      start_date: initialData?.start_date ? convertFromISODate(initialData.start_date) : '',
      end_date: initialData?.end_date ? convertFromISODate(initialData.end_date) : '',
      value: initialData?.value || 0,
      payment_day: initialData?.payment_day || 1,
      deposit_value: initialData?.deposit_value || null,
      status: (initialData?.status || 'draft') as ContractStatus,
      terms: initialData?.terms || null,
      has_renewal_option: initialData?.has_renewal_option || false,
      renewal_terms: initialData?.renewal_terms || null,
      special_conditions: initialData?.special_conditions || null,
      has_variable_rent: initialData?.has_variable_rent || false,
      variable_rent_values: initialData?.variable_rent_values || null,
      payment_due_day: initialData?.payment_due_day || null,
      on_time_discount_percentage: initialData?.on_time_discount_percentage || null,
      late_fee_percentage: initialData?.late_fee_percentage || null,
      is_discount_not_fee: initialData?.is_discount_not_fee || true,
      late_interest_percentage: initialData?.late_interest_percentage || null,
      late_daily_interest: initialData?.late_daily_interest || null,
      fine_percentage: initialData?.fine_percentage || null,
      payment_terms: initialData?.payment_terms || null,
      adjustment_index: initialData?.adjustment_index || null,
      adjustment_date: initialData?.adjustment_date ? convertFromISODate(initialData.adjustment_date) : null,
      agency_name: initialData?.agency_name || null,
      agency_contact: initialData?.agency_contact || null,
      agency_responsible_name: initialData?.agency_responsible_name || null,
      agency_responsible_contact: initialData?.agency_responsible_contact || null,
      commission_type: initialData?.commission_type || 'percentage',
      commission_value: initialData?.commission_value || null,
      recurring_transactions: null,
    },
  });

  const addRecurringTransaction = (type: 'income' | 'expense') => {
    const newTransaction: RecurringTransaction = {
      id: Date.now().toString(),
      type,
      name: '',
      amount: 0,
      category: '',
      frequency: 'monthly',
      start_date: '',
    };
    setRecurringTransactions(prev => [...prev, newTransaction]);
  };

  const removeRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateRecurringTransaction = (id: string, field: keyof RecurringTransaction, value: any) => {
    setRecurringTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, [field]: value } : t)
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitError(null);
    
    console.log('Submitting contract form data:', values);
    
    try {
      // Convert date strings to ISO format and ensure proper types
      const contractData = {
        title: values.title,
        property_id: values.property_id,
        tenant_name: values.tenant_name,
        tenant_document: values.tenant_document,
        tenant_contact: values.tenant_contact,
        start_date: convertToISODate(values.start_date),
        end_date: convertToISODate(values.end_date),
        value: values.value,
        payment_day: values.payment_day,
        deposit_value: values.deposit_value,
        status: values.status,
        terms: values.terms,
        has_renewal_option: values.has_renewal_option,
        renewal_terms: values.renewal_terms,
        special_conditions: values.special_conditions,
        has_variable_rent: values.has_variable_rent,
        variable_rent_values: values.variable_rent_values as VariableRentValue[] | null,
        payment_due_day: values.payment_due_day,
        on_time_discount_percentage: values.on_time_discount_percentage,
        late_fee_percentage: values.late_fee_percentage,
        is_discount_not_fee: values.is_discount_not_fee,
        late_interest_percentage: values.late_interest_percentage,
        late_daily_interest: values.late_daily_interest,
        fine_percentage: values.fine_percentage,
        payment_terms: values.payment_terms,
        adjustment_index: values.adjustment_index,
        adjustment_date: values.adjustment_date ? convertToISODate(values.adjustment_date) : null,
        agency_name: values.agency_name,
        agency_contact: values.agency_contact,
        agency_responsible_name: values.agency_responsible_name,
        agency_responsible_contact: values.agency_responsible_contact,
        commission_type: values.commission_type as 'percentage' | 'monetary' | null,
        commission_value: values.commission_value,
        recurring_transactions: recurringTransactions.length > 0 ? recurringTransactions : null,
      };

      if (initialData) {
        await updateContract({ id: initialData.id, ...contractData });
        onSuccess(initialData.id);
      } else {
        const newContract = await createContract(contractData);
        onSuccess(newContract.id);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'Erro inesperado ao salvar');
    }
  };

  const isSubmitting = isCreatingContract || isUpdatingContract;

  return (
    <div className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {submitError}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
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
                    <FormLabel>Propriedade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma propriedade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.title} - {property.address}, {property.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="tenant_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato do Inquilino</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXX-XXXX" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tenant_document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento do Inquilino</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF ou CNPJ" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valores e Datas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <MaskedDateInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="dd/mm/aaaa"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <FormControl>
                        <MaskedDateInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="dd/mm/aaaa"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Aluguel</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Valor do aluguel (mensal)" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia do Pagamento</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Dia do mês para pagamento" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adjustment_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Índice de Reajuste</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o índice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {adjustmentIndexOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adjustment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Reajuste</FormLabel>
                      <FormControl>
                        <MaskedDateInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="dd/mm/aaaa"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deposit_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Depósito (Caução)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Valor do depósito (opcional)" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Imobiliária</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="agency_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Imobiliária</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da imobiliária" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agency_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato da Imobiliária</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXX-XXXX" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agency_responsible_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agency_responsible_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato do Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXX-XXXX" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Comissão</FormLabel>
                    <FormControl>
                      <CommissionInput
                        commissionType={field.value as 'percentage' | 'monetary' | null}
                        commissionValue={form.watch('commission_value') || 0}
                        onCommissionTypeChange={field.onChange}
                        onCommissionValueChange={(value) => form.setValue('commission_value', value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Receitas e Despesas Recorrentes</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRecurringTransaction('income')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRecurringTransaction('expense')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Despesa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recurringTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma receita ou despesa recorrente cadastrada.
                </p>
              ) : (
                <div className="space-y-4">
                  {recurringTransactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecurringTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Nome"
                          value={transaction.name}
                          onChange={(e) => updateRecurringTransaction(transaction.id, 'name', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Valor"
                          value={transaction.amount}
                          onChange={(e) => updateRecurringTransaction(transaction.id, 'amount', parseFloat(e.target.value) || 0)}
                        />
                        <Select
                          value={transaction.frequency}
                          onValueChange={(value) => updateRecurringTransaction(transaction.id, 'frequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                            <SelectItem value="annually">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outras Informações</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Contrato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
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

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termos e Condições</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Termos e condições gerais do contrato"
                        className="resize-none"
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
                name="special_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condições Especiais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Condições especiais e cláusulas adicionais"
                        className="resize-none"
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
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Possui Opção de Renovação?</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Marque se o contrato possui opção de renovação.
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="renewal_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termos de Renovação</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Termos específicos para a renovação do contrato"
                        className="resize-none"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Seção de Reajustes - apenas para contratos existentes */}
          {initialData && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Receipt className="h-5 w-5 mr-2" />
                      Reajustes de Contrato
                    </CardTitle>
                    <ContractAdjustmentForm 
                      contractId={initialData.id}
                      currentValue={form.watch('value')}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ContractAdjustmentHistory contractId={initialData.id} />
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Contrato'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
