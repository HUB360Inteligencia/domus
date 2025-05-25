
import React, { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReceiptUploadFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ReceiptUploadField({ value, onChange, disabled }: ReceiptUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Apenas imagens (JPEG, PNG) e PDFs são permitidos');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB');
      return;
    }

    try {
      setIsUploading(true);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.data.user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('transaction_receipts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading receipt:', uploadError);
        toast.error('Erro ao fazer upload do recibo');
        return;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('transaction_receipts')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast.success('Recibo enviado com sucesso');
    } catch (error) {
      console.error('Receipt upload error:', error);
      toast.error('Erro ao fazer upload do recibo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleViewReceipt = () => {
    if (value) {
      window.open(value, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      <Label>Recibo/Comprovante</Label>
      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700 flex-1">Recibo anexado</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleViewReceipt}
          >
            Ver
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label htmlFor="receipt-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Clique para enviar ou arraste e solte
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PNG, JPG ou PDF até 5MB
                </span>
              </Label>
              <Input
                id="receipt-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileUpload}
                disabled={disabled || isUploading}
              />
            </div>
          </div>
        </div>
      )}
      {isUploading && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Enviando recibo...
          </div>
        </div>
      )}
    </div>
  );
}
