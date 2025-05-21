
import React from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Receipt, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { PropertyExpense, PropertyExpenseFormData } from '@/types/property-expense';

interface ExpenseFormProps {
  propertyId: string;
  expense?: PropertyExpense | null;
  onSubmit: (data: PropertyExpenseFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const expenseTypeOptions = [
  { label: 'Manutenção', value: 'maintenance' },
  { label: 'Taxa de Condomínio', value: 'condo_fee' },
  { label: 'Imposto/Taxa', value: 'tax' },
  { label: 'Vistoria', value: 'inspection' },
  { label: 'Reforma', value: 'renovation' },
  { label: 'Seguro', value: 'insurance' },
  { label: 'Outro', value: 'other' },
];

export function ExpenseForm({ 
  propertyId, 
  expense, 
  onSubmit, 
  isSubmitting,
  onCancel 
}: ExpenseFormProps) {
  const form = useForm<PropertyExpenseFormData>({
    defaultValues: expense 
      ? {
          property_id: expense.property_id,
          expense_type: expense.expense_type,
          amount: expense.amount,
          paid_at: expense.paid_at,
          description: expense.description || '',
          maintenance_details: expense.maintenance_details || '',
        }
      : {
          property_id: propertyId,
          expense_type: 'maintenance',
          amount: 0,
          paid_at: format(new Date(), 'yyyy-MM-dd'),
          description: '',
          maintenance_details: '',
        }
  });
  
  const expenseType = form.watch('expense_type');
  const isMaintenanceType = expenseType === 'maintenance';
  
  const handleSubmit = (data: PropertyExpenseFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="expense_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Despesa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de despesa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseTypeOptions.map(option => (
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paid_at"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Pagamento</FormLabel>
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
                        format(new Date(field.value), 'dd/MM/yyyy')
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
                    selected={new Date(field.value)}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição da despesa"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isMaintenanceType && (
          <FormField
            control={form.control}
            name="maintenance_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detalhes da Manutenção</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalhe o que foi feito na manutenção"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Descreva o tipo de manutenção realizada (ex: troca de torneira, reparo elétrico)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                {expense ? 'Atualizar Despesa' : 'Adicionar Despesa'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
