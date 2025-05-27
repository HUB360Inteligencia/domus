
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface NameFieldProps {
  form: UseFormReturn<TransactionFormData>;
}

export function NameField({ form }: NameFieldProps) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nome da Transação</FormLabel>
          <FormControl>
            <Input 
              placeholder="Digite o nome da transação"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
