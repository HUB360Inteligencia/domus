
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProperties } from '@/hooks/use-properties';
import { ContractFormData, ContractStatus, SignatureStatus } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// Form validation schema
const contractFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  property_id: z.string().optional().nullable(),
  tenant_name: z.string().min(3, 'Nome do inquilino deve ter pelo menos 3 caracteres'),
  tenant_document: z.string().optional().nullable(),
  tenant_contact: z.string().optional().nullable(),
  start_date: z.date({ required_error: 'Data de início é obrigatória' }),
  end_date: z.date({ required_error: 'Data de término é obrigatória' }),
  value: z.coerce.number().positive('Valor deve ser positivo'),
  payment_day: z.coerce.number().min(1, 'Dia deve estar entre 1 e 31').max(31, 'Dia deve estar entre 1 e 31'),
  deposit_value: z.coerce.number().optional().nullable(),
  status: z.string(),
  terms: z.string().optional().nullable(),
  has_renewal_option: z.boolean().default(false).optional(),
  renewal_terms: z.string().optional().nullable(),
  special_conditions: z.string().optional().nullable(),
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
  
  // Initialize the form with default values or initial data
  const form = useForm<z.infer<typeof contractFormSchema>>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      property_id: initialData?.property_id || null,
      tenant_name: initialData?.tenant_name || '',
      tenant_document: initialData?.tenant_document || '',
      tenant_contact: initialData?.tenant_contact || '',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      value: initialData?.value || 0,
      payment_day: initialData?.payment_day || 5,
      deposit_value: initialData?.deposit_value || null,
      status: initialData?.status || 'draft',
      terms: initialData?.terms || '',
      has_renewal_option: initialData?.has_renewal_option || false,
      renewal_terms: initialData?.renewal_terms || '',
      special_conditions: initialData?.special_conditions || '',
    },
  });

  // Handle form submission
  async function handleFormSubmit(data: z.infer<typeof contractFormSchema>) {
    // Format the form data for submission
    const formattedData: ContractFormData = {
      title: data.title,
      property_id: data.property_id,
      tenant_name: data.tenant_name,
      tenant_document: data.tenant_document,
      tenant_contact: data.tenant_contact,
      // Format dates to ISO string for backend
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.end_date.toISOString().split('T')[0],
      value: data.value,
      payment_day: data.payment_day,
      deposit_value: data.deposit_value,
      status: data.status as ContractStatus,
      terms: data.terms,
      has_renewal_option: data.has_renewal_option,
      renewal_terms: data.renewal_terms,
      special_conditions: data.special_conditions,
    };

    await onSubmit(formattedData, documentFile || undefined);
  }

  // Handle document file changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                        onValueChange={field.onChange}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
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
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
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
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Aluguel (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                name="deposit_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Depósito (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Opcional" 
                        {...field} 
                        value={field.value ?? ''} 
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
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
                      onValueChange={field.onChange}
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
