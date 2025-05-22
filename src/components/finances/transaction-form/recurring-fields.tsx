
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';
import { DateField } from './date-field';

interface RecurringFieldsProps {
  form: UseFormReturn<TransactionFormData>;
}

export function RecurringFields({ form }: RecurringFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="recurring_frequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Frequency</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <DateField
        form={form}
        name="recurring_end_date"
        label="End Date (Optional)"
        placeholder="No end date"
        optional={true}
      />
    </div>
  );
}
