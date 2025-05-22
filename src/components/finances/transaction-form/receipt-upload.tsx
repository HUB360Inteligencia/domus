
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';
import { useReceiptUpload } from '@/hooks/use-receipt-upload';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReceiptUploadProps {
  form: UseFormReturn<TransactionFormData>;
}

export function ReceiptUpload({ form }: ReceiptUploadProps) {
  const { selectedFile, fileInputRef, handleFileChange, openCamera } = useReceiptUpload();
  const isMobile = useIsMobile();

  return (
    <FormField
      control={form.control}
      name="receipt_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Receipt</FormLabel>
          <div className={isMobile ? "space-y-2" : "grid grid-cols-2 gap-4"}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              capture={isMobile ? "environment" : undefined}
              className="hidden"
              id="receipt-upload"
            />
            
            {isMobile ? (
              <div className="flex flex-col gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={openCamera}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Receipt
                </Button>
              </div>
            ) : (
              <Button 
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </Button>
            )}
          </div>
          {selectedFile && (
            <div className="text-sm text-muted-foreground mt-2">
              Selected file: {selectedFile.name}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
