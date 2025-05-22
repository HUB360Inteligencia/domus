
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
  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="taxes">Taxes</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
