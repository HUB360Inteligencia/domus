
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthlyTransactionFormData {
  name: string;
  amount: number;
  category: string;
  description?: string;
}

interface MonthlyTransactionFormProps {
  type: 'income' | 'expense';
  onSubmit: (data: {
    name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    categoryName: string;
    description?: string;
  }) => void;
  onCancel: () => void;
}

export const MonthlyTransactionForm: React.FC<MonthlyTransactionFormProps> = ({
  type,
  onSubmit,
  onCancel
}) => {
  const { categories } = useFinancialCategories();
  
  const form = useForm<MonthlyTransactionFormData>({
    defaultValues: {
      name: '',
      amount: 0,
      category: '',
      description: ''
    }
  });

  const categoryOptions = categories
    .filter(cat => cat.type === type)
    .map(cat => ({
      label: cat.name,
      value: cat.id,
      type: cat.type
    }));

  const handleSubmit = (data: MonthlyTransactionFormData) => {
    const selectedCategory = categories.find(c => c.id === data.category);
    
    onSubmit({
      name: data.name,
      amount: data.amount,
      type,
      category: data.category,
      categoryName: selectedCategory?.name || 'Categoria não encontrada',
      description: data.description
    });

    form.reset();
  };

  const typeLabel = type === 'income' ? 'Receita' : 'Despesa';
  const borderColor = type === 'income' ? 'border-green-200' : 'border-red-200';

  return (
    <Card className={`${borderColor}`}>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <h4 className="font-semibold">Adicionar {typeLabel}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Nome é obrigatório' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da {typeLabel}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Nome da ${typeLabel.toLowerCase()}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                rules={{ 
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              rules={{ required: 'Categoria é obrigatória' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((option) => (
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descrição adicional..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                className={type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                Adicionar {typeLabel}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
