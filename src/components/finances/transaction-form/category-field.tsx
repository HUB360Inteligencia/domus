
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface CategoryFieldProps {
  form: UseFormReturn<TransactionFormData>;
  categories: { value: string; label: string }[];
}

export function CategoryField({ form, categories }: CategoryFieldProps) {
  // More strict filtering to ensure no empty values
  const validCategories = categories.filter(category => 
    category && 
    category.value && 
    typeof category.value === 'string' && 
    category.value.trim() !== '' && 
    category.value !== 'undefined' &&
    category.value !== 'null' &&
    category.label &&
    typeof category.label === 'string' &&
    category.label.trim() !== ''
  );

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Categoria</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value || undefined}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {validCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
