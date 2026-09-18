import React, { useRef, useState } from 'react';
import { ExternalLink, FileText, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RECEIPT_ACCEPT, uploadReceiptFile, validateReceiptFile } from '@/api/receipts';
import { cn } from '@/lib/utils';

interface ReceiptUploadFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  /** Oculte quando o campo já estiver dentro de um FormItem com rótulo próprio. */
  hideLabel?: boolean;
}

export function ReceiptUploadField({ value, onChange, disabled, hideLabel = false }: ReceiptUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const upload = async (file?: File | null) => {
    if (!file) return;

    const validationError = validateReceiptFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadReceiptFile(file, 'transactions');
      onChange(url);
      toast.success('Comprovante anexado');
    } catch (error) {
      console.error('Receipt upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar o comprovante');
    } finally {
      setIsUploading(false);
    }
  };

  const isPdf = value?.toLowerCase().split('?')[0].endsWith('.pdf');

  return (
    <div className="space-y-2">
      {!hideLabel && <Label>Recibo/Comprovante</Label>}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={RECEIPT_ACCEPT}
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = '';
        }}
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3">
          {isPdf ? (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9f5d4c]/12 text-[#9f5d4c]">
              <FileText className="h-5 w-5" />
            </div>
          ) : (
            <img src={value} alt="Comprovante" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          )}
          <span className="flex-1 text-sm font-medium">Comprovante anexado</span>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={value} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Remover comprovante"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || isUploading}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !disabled && !isUploading) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!disabled && !isUploading) void upload(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            disabled || isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-accent/60 hover:bg-muted/40',
            isDragging ? 'border-accent bg-accent/10' : 'border-border'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
              <span className="mt-2 text-sm text-muted-foreground">Enviando comprovante...</span>
            </>
          ) : (
            <>
              <Upload className="h-7 w-7 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium">Clique para enviar ou arraste o arquivo</span>
              <span className="mt-0.5 text-xs text-muted-foreground">PNG, JPG ou PDF até 5MB</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
