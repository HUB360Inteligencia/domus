
import React from 'react';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface TransactionTypeSelectorProps {
  form: UseFormReturn<TransactionFormData>;
}

export function TransactionTypeSelector({ form }: TransactionTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="transaction_type"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex space-x-1"
            >
              <div className="flex items-center space-x-2 rounded-l-md border border-r-0 px-3 py-2 bg-green-100 dark:bg-green-900/20">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="font-medium">Receita</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-r-md border px-3 py-2 bg-red-100 dark:bg-red-900/20">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="font-medium">Despesa</Label>
              </div>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
