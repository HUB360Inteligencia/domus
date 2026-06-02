
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface AmountFieldProps {
  form: UseFormReturn<TransactionFormData>;
  transactionType: 'income' | 'expense';
}

export function AmountField({ form, transactionType }: AmountFieldProps) {
  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Valor (R$)</FormLabel>
          <FormControl>
            <CurrencyInput
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              placeholder="R$ 0,00"
              className={transactionType === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
