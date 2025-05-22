
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';
import { DateField } from './date-field';

interface RecurringFieldsProps {
  form: UseFormReturn<TransactionFormData>;
}

export function RecurringFields({ form }: RecurringFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="recurring_frequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Frequência</FormLabel>
            <Select 
              onValueChange={field.onChange}
              defaultValue={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <DateField 
        form={form} 
        name="recurring_end_date" 
        label="Data de Término (Opcional)" 
      />
    </>
  );
}
