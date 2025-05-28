
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryField } from '@/components/finances/transaction-form/category-field';
import { useFinancialCategories } from '@/hooks/use-financial-categories';

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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <h4 className="font-semibold">Adicionar {typeLabel}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome da {typeLabel}</label>
              <Input
                {...form.register('name', { required: true })}
                placeholder={`Nome da ${typeLabel.toLowerCase()}`}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                step="0.01"
                {...form.register('amount', { 
                  required: true,
                  valueAsNumber: true,
                  min: 0.01
                })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <CategoryField
              form={form}
              categories={categoryOptions}
              transactionType={type}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Textarea
              {...form.register('description')}
              placeholder="Descrição adicional..."
              rows={2}
            />
          </div>

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
      </CardContent>
    </Card>
  );
};
