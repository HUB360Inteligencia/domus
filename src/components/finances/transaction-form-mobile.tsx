
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, ChevronDownIcon, PlusCircleIcon } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialCategories, useFinancialMutations } from '@/hooks/use-financial-transactions';
import { FinancialTransaction, FinancialTransactionFormData, TransactionType } from '@/types/financial';
import { toast } from 'sonner';
import { ReceiptUploadMobile } from './receipt-upload-mobile';

// Simplified schema for mobile experience
const transactionSchema = z.object({
  property_id: z.string().nullable(),
  transaction_type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'A categoria é obrigatória'),
  amount: z.preprocess(
    (val) => (val === '' ? 0 : Number(String(val).replace(',', '.'))),
    z.number().min(0.01, 'O valor deve ser maior que zero')
  ),
  transaction_date: z.date({
    required_error: 'A data da transação é obrigatória',
  }),
  description: z.string().optional().nullable(),
  recurring: z.boolean().default(false),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormMobileProps {
  onSuccess?: () => void;
  defaultPropertyId?: string | null;
  defaultTransactionType?: TransactionType;
}

export const TransactionFormMobile = ({
  onSuccess,
  defaultPropertyId = null,
  defaultTransactionType = 'expense',
}: TransactionFormMobileProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>('expense');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { properties } = useProperties();
  const { data: incomeCategories, isLoading: isLoadingIncomeCategories } = useFinancialCategories('income');
  const { data: expenseCategories, isLoading: isLoadingExpenseCategories } = useFinancialCategories('expense');
  const { createTransaction, createCategory, uploadReceipt } = useFinancialMutations();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      property_id: defaultPropertyId,
      transaction_type: defaultTransactionType,
      category: '',
      amount: 0,
      transaction_date: new Date(),
      description: '',
      recurring: false,
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const data: FinancialTransactionFormData = {
        property_id: values.property_id,
        transaction_type: values.transaction_type,
        category: values.category,
        subcategory: null,
        amount: values.amount,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        description: values.description || null,
        recurring: values.recurring,
        recurring_frequency: values.recurring ? 'monthly' : null,
        recurring_end_date: null,
        payment_method: null,
      };

      // Primeiro, cria a transação
      const result = await createTransaction.mutateAsync(data);

      // Se houver um arquivo selecionado, faz upload do comprovante
      if (selectedFile && result.id) {
        await uploadReceipt.mutateAsync({
          file: selectedFile,
          transactionId: result.id
        });
      }

      form.reset();
      setSelectedFile(null);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar a transação');
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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const transactionType = form.watch('transaction_type');
  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;
  const isLoading = isLoadingIncomeCategories || isLoadingExpenseCategories || createTransaction.isPending;

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
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
              name="amount"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormControl>
                    <Input
                      placeholder="Valor R$"
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
          </div>

          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Categoria" />
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
                          <DialogTitle>Nova Categoria</DialogTitle>
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
                            <FormLabel htmlFor="newCategory">Nome</FormLabel>
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
                            Criar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Imóvel (opcional)" />
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

          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
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
                            <span>Data da transação</span>
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

          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Descrição (opcional)"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
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

          <div className="grid grid-cols-1 gap-3 mt-4">
            <ReceiptUploadMobile
              onFileSelect={handleFileSelect}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Salvando...' : 'Registrar Transação'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
