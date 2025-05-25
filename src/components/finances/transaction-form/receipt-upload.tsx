
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ReceiptUploadField } from '../receipt-upload-field';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface ReceiptUploadProps {
  form: UseFormReturn<TransactionFormData>;
}

export function ReceiptUpload({ form }: ReceiptUploadProps) {
  return (
    <FormField
      control={form.control}
      name="receipt_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Recibo/Comprovante</FormLabel>
          <FormControl>
            <ReceiptUploadField
              value={field.value}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
