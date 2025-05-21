import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, PlusCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialCategories, useFinancialMutations } from '@/hooks/use-financial-transactions';
import { FinancialTransaction, FinancialTransactionFormData, TransactionType, RecurringFrequency } from '@/types/financial';

const transactionSchema = z.object({
  property_id: z.string().nullable(),
  transaction_type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'A categoria é obrigatória'),
  subcategory: z.string().optional().nullable(),
  amount: z.preprocess(
    (val) => (val === '' ? 0 : Number(String(val).replace(',', '.'))),
    z.number().min(0.01, 'O valor deve ser maior que zero')
  ),
  transaction_date: z.date({
    required_error: 'A data da transação é obrigatória',
  }),
  description: z.string().optional().nullable(),
  recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['monthly', 'quarterly', 'semiannual', 'annual']).optional().nullable(),
  recurring_end_date: z.date().optional().nullable(),
  payment_method: z.string().optional().nullable(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: FinancialTransaction;
  onSuccess?: () => void;
  defaultPropertyId?: string | null;
  defaultTransactionType?: TransactionType;
}

export const TransactionForm = ({
  transaction,
  onSuccess,
  defaultPropertyId = null,
  defaultTransactionType = 'expense',
}: TransactionFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>('expense');

  const { properties } = useProperties();
  const { data: incomeCategories, isLoading: isLoadingIncomeCategories } = useFinancialCategories('income');
  const { data: expenseCategories, isLoading: isLoadingExpenseCategories } = useFinancialCategories('expense');
  const { createTransaction, updateTransaction, createCategory } = useFinancialMutations();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      property_id: defaultPropertyId,
      transaction_type: defaultTransactionType,
      category: '',
      subcategory: '',
      amount: 0,
      transaction_date: new Date(),
      description: '',
      recurring: false,
      recurring_frequency: null,
      recurring_end_date: null,
      payment_method: null,
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        property_id: transaction.property_id,
        transaction_type: transaction.transaction_type,
        category: transaction.category,
        subcategory: transaction.subcategory || '',
        amount: Number(transaction.amount),
        transaction_date: new Date(transaction.transaction_date),
        description: transaction.description || '',
        recurring: Boolean(transaction.recurring),
        recurring_frequency: transaction.recurring_frequency || null,
        recurring_end_date: transaction.recurring_end_date ? new Date(transaction.recurring_end_date) : null,
        payment_method: transaction.payment_method || null,
      });
    }
  }, [transaction, form]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const data: FinancialTransactionFormData = {
        property_id: values.property_id,
        transaction_type: values.transaction_type,
        category: values.category,
        subcategory: values.subcategory || null,
        amount: values.amount,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        description: values.description || null,
        recurring: values.recurring,
        recurring_frequency: values.recurring ? values.recurring_frequency : null,
        recurring_end_date: values.recurring && values.recurring_end_date 
          ? format(values.recurring_end_date, 'yyyy-MM-dd') 
          : null,
        payment_method: values.payment_method || null,
      };

      if (transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, data });
      } else {
        await createTransaction.mutateAsync(data);
        form.reset();
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        await createCategory.mutateAsync({
          name: newCategoryName.trim(),
          type: newCategoryType,
        });
        setNewCategoryName('');
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Erro ao criar categoria:', error);
      }
    }
  };

  const transactionType = form.watch('transaction_type');
  const isRecurring = form.watch('recurring');
  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;
  const isLoading = isLoadingIncomeCategories || isLoadingExpenseCategories;

  const paymentMethods = [
    'Dinheiro',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Transferência Bancária',
    'Pix',
    'Boleto',
    'Outro'
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Tipo de Transação</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!transaction}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de transação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Imóvel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um imóvel (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sem imóvel específico</SelectItem>
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
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Categoria</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map(category => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0"
                        >
                          <PlusCircleIcon className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <FormLabel htmlFor="newCategoryType">Tipo</FormLabel>
                            <Select
                              onValueChange={(value: 'income' | 'expense') => setNewCategoryType(value)}
                              defaultValue={transactionType}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">Receita</SelectItem>
                                <SelectItem value="expense">Despesa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <FormLabel htmlFor="newCategory">Nome da Categoria</FormLabel>
                            <Input
                              id="newCategory"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                          </div>
                          
                          <Button 
                            type="button" 
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim()}
                          >
                            Criar Categoria
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Subcategoria (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Subcategoria" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0,00"
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => {
                        // Permitir virgula ou ponto como separador decimal
                        const value = e.target.value.replace(',', '.');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Data da Transação</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
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

          <div className="flex flex-col sm:flex-row gap-4">
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Método de Pagamento (opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Não especificado</SelectItem>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>
                          {method}
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
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between w-full sm:w-1/2 p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel>Transação Recorrente</FormLabel>
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
          </div>

          {isRecurring && (
            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="recurring_frequency"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-1/2">
                    <FormLabel>Frequência de Recorrência</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || 'monthly'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="semiannual">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurring_end_date"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-1/2">
                    <FormLabel>Data Final de Recorrência (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Sem data final</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
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
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalhes adicionais sobre a transação"
                    className="resize-none min-h-[80px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            {onSuccess && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSuccess}
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={createTransaction.isPending || updateTransaction.isPending}
              className={transaction?.transaction_type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {createTransaction.isPending || updateTransaction.isPending
                ? 'Salvando...'
                : transaction ? 'Atualizar Transação' : 'Registrar Transação'
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
