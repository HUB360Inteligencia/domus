
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, FileDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProperties } from '@/hooks/use-properties';
import { 
  useFinancialTransactions, 
  useFinancialCategories 
} from '@/hooks/use-financial-transactions';
import { generateFinancialReport } from '@/api/financial-transactions';

const reportSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  format: z.enum(['pdf', 'excel']),
  startDate: z.date({
    required_error: 'A data inicial é obrigatória',
  }),
  endDate: z.date({
    required_error: 'A data final é obrigatória',
  }),
  propertyId: z.string().optional(),
  transactionType: z.enum(['all', 'income', 'expense']).default('all'),
  includeAnalytics: z.boolean().default(true),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export const FinancialReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: properties } = useProperties();
  const { data: transactions } = useFinancialTransactions();
  const { data: incomeCategories } = useFinancialCategories('income');
  const { data: expenseCategories } = useFinancialCategories('expense');

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: `Relatório Financeiro - ${format(new Date(), 'dd/MM/yyyy')}`,
      format: 'pdf',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      propertyId: undefined,
      transactionType: 'all',
      includeAnalytics: true,
    },
  });

  const onSubmit = async (values: ReportFormValues) => {
    try {
      setIsGenerating(true);

      const filters = {
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        endDate: format(values.endDate, 'yyyy-MM-dd'),
        propertyIds: values.propertyId ? [values.propertyId] : undefined,
        transactionTypes: values.transactionType !== 'all' 
          ? [values.transactionType as 'income' | 'expense'] 
          : undefined,
      };

      // Preparar dados para o relatório
      const reportData = {
        title: values.title,
        filters: {
          startDate: format(values.startDate, 'dd/MM/yyyy'),
          endDate: format(values.endDate, 'dd/MM/yyyy'),
          property: values.propertyId 
            ? properties?.find(p => p.id === values.propertyId)?.title || 'Todos'
            : 'Todos',
          transactionType: values.transactionType === 'income' 
            ? 'Receitas' 
            : values.transactionType === 'expense' 
              ? 'Despesas' 
              : 'Todos',
        },
        transactions: transactions?.filter(transaction => {
          const transactionDate = new Date(transaction.transaction_date);
          
          // Filtro por data
          if (transactionDate < values.startDate || transactionDate > values.endDate) {
            return false;
          }
          
          // Filtro por imóvel
          if (values.propertyId && transaction.property_id !== values.propertyId) {
            return false;
          }
          
          // Filtro por tipo de transação
          if (values.transactionType !== 'all' && transaction.transaction_type !== values.transactionType) {
            return false;
          }
          
          return true;
        }) || [],
        categories: {
          income: incomeCategories || [],
          expense: expenseCategories || [],
        },
        properties: properties || [],
      };

      // Gerar e baixar relatório
      const reportBlob = await generateFinancialReport(
        values.format,
        reportData,
        values.title
      );

      // Criar link para download
      const url = URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${values.title.replace(/\s+/g, '_')}.${values.format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar Relatório Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Relatório</FormLabel>
                    <FormControl>
                      <Input placeholder="Relatório Financeiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato do Relatório</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Inicial</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data inicial</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Final</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data final</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imóvel (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os imóveis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todos os imóveis</SelectItem>
                        {properties?.map(property => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.title}
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
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Transação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todas as transações</SelectItem>
                        <SelectItem value="income">Apenas receitas</SelectItem>
                        <SelectItem value="expense">Apenas despesas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isGenerating} className="flex gap-2">
                {isGenerating ? 'Gerando relatório...' : 'Gerar e Baixar Relatório'}
                <FileDownIcon className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
