
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecurringToggleProps {
  form: UseFormReturn<TransactionFormData>;
}

export function RecurringToggle({ form }: RecurringToggleProps) {
  const isMobile = useIsMobile();

  return (
    <FormField
      control={form.control}
      name="recurring"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel className="text-base">
              {isMobile ? "Recurring" : "Recurring Transaction"}
            </FormLabel>
            {!isMobile && (
              <FormDescription>
                Is this a recurring transaction?
              </FormDescription>
            )}
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
