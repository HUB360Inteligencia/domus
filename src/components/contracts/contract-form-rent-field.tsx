
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';
import { ContractFormData } from '@/types/contract';
import { formatCurrency, parseCurrencyToNumber } from '@/lib/format';

interface ContractFormRentFieldProps {
  form: UseFormReturn<ContractFormData>;
}

export function ContractFormRentField({ form }: ContractFormRentFieldProps) {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow typing numbers and common currency symbols
    const sanitizedValue = value.replace(/[^\d,.]/g, '');
    e.target.value = sanitizedValue;
  };

  const handleValueBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseCurrencyToNumber(value);
    form.setValue('value', numericValue);
    e.target.value = formatCurrency(numericValue);
  };

  const currentValue = form.watch('value');

  return (
    <FormField
      control={form.control}
      name="value"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Valor do Aluguel *</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="R$ 0,00"
              defaultValue={currentValue ? formatCurrency(currentValue) : ''}
              onChange={handleValueChange}
              onBlur={handleValueBlur}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
