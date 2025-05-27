
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface CategoryFieldProps {
  form: UseFormReturn<TransactionFormData>;
  categories: { value: string; label: string; type?: string }[];
  transactionType?: 'income' | 'expense';
}

export function CategoryField({ form, categories, transactionType }: CategoryFieldProps) {
  // Filter categories based on transaction type if specified
  const filteredCategories = transactionType 
    ? categories.filter(category => category.type === transactionType)
    : categories;

  // Ensure valid categories for rendering
  const validCategories = filteredCategories.filter(category => {
    const hasValidValue = category.value && 
                         typeof category.value === 'string' && 
                         category.value.trim() !== '';
                         
    const hasValidLabel = category.label &&
                         typeof category.label === 'string' &&
                         category.label.trim() !== '';
    
    return hasValidValue && hasValidLabel;
  });

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Categoria</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || undefined}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {validCategories.length > 0 ? (
                validCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-categories" disabled>
                  Nenhuma categoria disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
