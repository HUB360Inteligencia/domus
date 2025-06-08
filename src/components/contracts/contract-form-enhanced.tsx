import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, Receipt } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContractFormData, Contract } from '@/types/contract';
import { useContracts } from '@/hooks/use-contracts';
import { ContractAdjustmentForm } from './contract-adjustment-form';
import { ContractAdjustmentHistory } from './contract-adjustment-history';
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from 'date-fns/locale';
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { useProperties } from '@/hooks/use-properties';
import { formatCurrency } from '@/lib/format';
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

interface ContractFormEnhancedProps {
  initialData?: Contract | null;
  onSuccess: (contractId: string) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Título deve ter pelo menos 3 caracteres.",
  }),
  property_id: z.string().nullable(),
  tenant_name: z.string().min(3, {
    message: "Nome do inquilino deve ter pelo menos 3 caracteres.",
  }),
  tenant_document: z.string().nullable(),
  tenant_contact: z.string().nullable(),
  start_date: z.date(),
  end_date: z.date(),
  value: z.number(),
  payment_day: z.number(),
  deposit_value: z.number().nullable(),
  status: z.string(),
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
})

export function ContractFormEnhanced({ 
  initialData, 
  onSuccess, 
  onCancel 
}: ContractFormEnhancedProps) {
  const { createContract, updateContract, isCreatingContract, isUpdatingContract } = useContracts();
  const { properties } = useProperties();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      property_id: initialData?.property_id || null,
      tenant_name: initialData?.tenant_name || '',
      tenant_document: initialData?.tenant_document || null,
      tenant_contact: initialData?.tenant_contact || null,
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : new Date(),
      value: initialData?.value || 0,
      payment_day: initialData?.payment_day || 1,
      deposit_value: initialData?.deposit_value || null,
      status: initialData?.status || 'draft',
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
      adjustment_date: initialData?.adjustment_date || null,
      agency_name: initialData?.agency_name || null,
      agency_contact: initialData?.agency_contact || null,
      agency_responsible_name: initialData?.agency_responsible_name || null,
      agency_responsible_contact: initialData?.agency_responsible_contact || null,
      commission_type: initialData?.commission_type || null,
      commission_value: initialData?.commission_value || null,
    },
  });

  const [formData, setFormData] = useState<ContractFormData>({
    title: '',
    property_id: null,
    tenant_name: '',
    tenant_document: '',
    tenant_contact: '',
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    value: 0,
    payment_day: 1,
    deposit_value: 0,
    status: 'draft',
    terms: '',
    has_renewal_option: false,
    renewal_terms: '',
    special_conditions: '',
    has_variable_rent: false,
    variable_rent_values: [],
    payment_due_day: 1,
    on_time_discount_percentage: 0,
    late_fee_percentage: 0,
    is_discount_not_fee: true,
    late_interest_percentage: 0,
    late_daily_interest: 0,
    fine_percentage: 0,
    payment_terms: '',
    adjustment_index: '',
    adjustment_date: '',
    agency_name: '',
    agency_contact: '',
    agency_responsible_name: '',
    agency_responsible_contact: '',
    commission_type: 'percentage',
    commission_value: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        property_id: initialData.property_id || null,
        tenant_name: initialData.tenant_name || '',
        tenant_document: initialData.tenant_document || '',
        tenant_contact: initialData.tenant_contact || '',
        start_date: initialData.start_date || new Date().toISOString(),
        end_date: initialData.end_date || new Date().toISOString(),
        value: initialData.value || 0,
        payment_day: initialData.payment_day || 1,
        deposit_value: initialData.deposit_value || 0,
        status: initialData.status || 'draft',
        terms: initialData.terms || '',
        has_renewal_option: initialData.has_renewal_option || false,
        renewal_terms: initialData.renewal_terms || '',
        special_conditions: initialData.special_conditions || '',
        has_variable_rent: initialData.has_variable_rent || false,
        variable_rent_values: initialData.variable_rent_values || [],
        payment_due_day: initialData.payment_due_day || 1,
        on_time_discount_percentage: initialData.on_time_discount_percentage || 0,
        late_fee_percentage: initialData.late_fee_percentage || 0,
        is_discount_not_fee: initialData.is_discount_not_fee || true,
        late_interest_percentage: initialData.late_interest_percentage || 0,
        late_daily_interest: initialData.late_daily_interest || 0,
        fine_percentage: initialData.fine_percentage || 0,
        payment_terms: initialData.payment_terms || '',
        adjustment_index: initialData.adjustment_index || '',
        adjustment_date: initialData.adjustment_date || '',
        agency_name: initialData.agency_name || '',
        agency_contact: initialData.agency_contact || '',
        agency_responsible_name: initialData.agency_responsible_name || '',
        agency_responsible_contact: initialData.agency_responsible_contact || '',
        commission_type: initialData.commission_type || 'percentage',
        commission_value: initialData.commission_value || 0,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    console.log('Submitting contract form data:', formData);
    
    try {
      if (initialData) {
        await updateContract({ id: initialData.id, ...formData });
        onSuccess(initialData.id);
      } else {
        const newContract = await createContract(formData);
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input placeholder="(XX) XXXX-XXXX" {...field} />
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
                    <Input placeholder="CPF ou CNPJ" {...field} />
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker
                          mode="single"
                          locale={ptBR}
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker
                          mode="single"
                          locale={ptBR}
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      checked={field.value}
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
                    currentValue={formData.value}
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
    </div>
  );
}
