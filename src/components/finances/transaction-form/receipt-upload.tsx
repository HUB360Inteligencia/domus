
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';
import { useReceiptUpload } from '@/hooks/use-receipt-upload';

interface ReceiptUploadProps {
  form: UseFormReturn<TransactionFormData>;
}

export function ReceiptUpload({ form }: ReceiptUploadProps) {
  const { fileInputRef, handleFileChange, openCamera } = useReceiptUpload();

  // Quando um arquivo é selecionado, atualize o form
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e);
    if (e.target.files && e.target.files[0]) {
      // Aqui estamos apenas definindo o nome do arquivo para exibição
      // O upload real seria tratado no momento da submissão do formulário
      form.setValue('receipt_url', e.target.files[0].name);
    }
  };

  return (
    <FormField
      control={form.control}
      name="receipt_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Recibo/Comprovante (Opcional)</FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <Input
                placeholder="Nenhum arquivo selecionado"
                readOnly
                value={field.value || ''}
                className="flex-1"
              />
            </FormControl>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={openCamera}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept="image/*"
            className="hidden"
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
