
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface RecurringToggleProps {
  form: UseFormReturn<TransactionFormData>;
}

export function RecurringToggle({ form }: RecurringToggleProps) {
  return (
    <FormField
      control={form.control}
      name="recurring"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>Transação Recorrente</FormLabel>
            <FormDescription>
              Esta é uma transação que se repete regularmente?
            </FormDescription>
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
  );
}
