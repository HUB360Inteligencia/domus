
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
  onAddItem: (data: {
    name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    categoryName: string;
    description?: string;
  }) => void;
}

export const MonthlyTransactionForm: React.FC<MonthlyTransactionFormProps> = ({
  onAddItem
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

  const handleSubmit = (data: MonthlyTransactionFormData, type: 'income' | 'expense') => {
    const selectedCategory = categories.find(c => c.id === data.category);
    
    onAddItem({
      name: data.name,
      amount: data.amount,
      type,
      category: data.category,
      categoryName: selectedCategory?.name || 'Categoria não encontrada',
      description: data.description
    });

    form.reset();
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Income Form */}
      <Card className="border-green-200">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => handleSubmit(data, 'income'))} className="space-y-4">
              <h4 className="font-semibold text-green-700">Adicionar Receita</h4>
              
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Nome é obrigatório' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Receita</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome da receita"
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
                        {incomeCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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

              <Button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Adicionar Receita
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Expense Form */}
      <Card className="border-red-200">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => handleSubmit(data, 'expense'))} className="space-y-4">
              <h4 className="font-semibold text-red-700">Adicionar Despesa</h4>
              
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Nome é obrigatório' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Despesa</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome da despesa"
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
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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

              <Button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Adicionar Despesa
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
