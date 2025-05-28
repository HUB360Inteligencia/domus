
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';
import { ContractFormData } from '@/types/contract';
import { formatCurrency, parseCurrencyInput } from '@/utils/currency';

interface ContractFormRentFieldProps {
  form: UseFormReturn<ContractFormData>;
}

export function ContractFormRentField({ form }: ContractFormRentFieldProps) {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseCurrencyInput(value);
    form.setValue('value', numericValue);
  };

  const currentValue = form.watch('value');
  const displayValue = currentValue ? formatCurrency(currentValue) : '';

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
              value={displayValue}
              onChange={handleValueChange}
              onBlur={(e) => {
                const numericValue = parseCurrencyInput(e.target.value);
                form.setValue('value', numericValue);
                field.onBlur();
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
