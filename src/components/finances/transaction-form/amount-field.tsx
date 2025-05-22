
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
  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Amount (R$)</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              step="0.01"
              placeholder="0.00"
              className={`text-lg ${
                transactionType === 'income' ? 'text-green-600' : 'text-red-600'
              }`}
              {...field} 
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
