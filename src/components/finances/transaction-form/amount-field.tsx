
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface AmountFieldProps {
  form: UseFormReturn<TransactionFormData>;
  transactionType: 'income' | 'expense';
}

export function AmountField({ form, transactionType }: AmountFieldProps) {
  // Converte o valor numérico para string formatada para o campo de entrada
  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toString();
  };

  // Converte a string formatada de volta para número ao atualizar o formulário
  const parseValue = (value: string): number => {
    if (value === '') return 0;
    return parseFloat(value);
  };

  return (
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
              className={`${transactionType === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              {...field}
              value={formatValue(field.value)}
              onChange={(e) => field.onChange(parseValue(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
