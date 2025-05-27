
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

  // More strict filtering to ensure no empty values
  const validCategories = filteredCategories.filter(category => {
    // Log any problematic categories for debugging
    if (!category || !category.value || !category.label) {
      console.log('Filtering out invalid category:', category);
      return false;
    }
    
    const hasValidValue = category.value && 
                         typeof category.value === 'string' && 
                         category.value.trim() !== '' && 
                         category.value !== 'undefined' &&
                         category.value !== 'null' &&
                         category.value !== 'empty';
                         
    const hasValidLabel = category.label &&
                         typeof category.label === 'string' &&
                         category.label.trim() !== '';
    
    if (!hasValidValue || !hasValidLabel) {
      console.log('Filtering out category with invalid value/label:', category);
      return false;
    }
    
    return true;
  });

  console.log('Valid categories for select:', validCategories);

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
                validCategories.map((category) => {
                  // Additional safety check before rendering
                  if (!category.value || category.value.trim() === '') {
                    console.error('Attempting to render SelectItem with empty value:', category);
                    return null;
                  }
                  return (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  );
                })
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
