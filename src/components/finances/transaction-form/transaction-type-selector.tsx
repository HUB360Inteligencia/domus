
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { CheckCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface TransactionTypeSelectorProps {
  form: UseFormReturn<TransactionFormData>;
}

export function TransactionTypeSelector({ form }: TransactionTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="transaction_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Transaction Type</FormLabel>
          <div className="flex gap-4">
            <Card 
              className={`flex-1 cursor-pointer ${
                field.value === 'income' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
              onClick={() => field.onChange('income')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="font-medium">Income</div>
                {field.value === 'income' && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardContent>
            </Card>
            
            <Card 
              className={`flex-1 cursor-pointer ${
                field.value === 'expense' ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
              onClick={() => field.onChange('expense')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="font-medium">Expense</div>
                {field.value === 'expense' && <CheckCircle className="h-5 w-5 text-red-500" />}
              </CardContent>
            </Card>
          </div>
        </FormItem>
      )}
    />
  );
}
