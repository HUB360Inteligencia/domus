
import React, { useState } from 'react';
import { Check, FileQuestion, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReceiptUploadProps {
  expenseId: string;
  currentUrl?: string | null;
  onUpload: (params: { fileObject: File; expenseId: string }) => void;
  isUploading: boolean;
  onCancel?: () => void;
}

export function ReceiptUpload({
  expenseId,
  currentUrl,
  onUpload,
  isUploading,
  onCancel
}: ReceiptUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onUpload({
        fileObject: selectedFile,
        expenseId
      });
    }
  };

  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (onCancel) onCancel();
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    const isImage = selectedFile.type.startsWith('image/');
    const isPdf = selectedFile.type === 'application/pdf';

    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className={cn(
          "h-10 w-10 rounded-md flex items-center justify-center",
          isImage ? "bg-blue-50" : "bg-amber-50"
        )}>
          {isImage ? (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="h-full w-full object-cover rounded-md"
            />
          ) : (
            <FileQuestion className={cn(
              "h-6 w-6",
              isPdf ? "text-red-500" : "text-amber-500"
            )} />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
      />
      
      {currentUrl && !selectedFile ? (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Comprovante atual:</p>
          {currentUrl.endsWith('.pdf') ? (
            <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded">
              <FileQuestion className="h-5 w-5 text-red-500" />
              <a 
                href={currentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Visualizar PDF
              </a>
            </div>
          ) : (
            <div className="border rounded overflow-hidden mb-2">
              <img 
                src={currentUrl} 
                alt="Recibo" 
                className="max-h-44 object-contain w-full"
              />
            </div>
          )}
        </div>
      ) : null}

      {renderFilePreview()}

      <div className="flex justify-end space-x-2 mt-4">
        {selectedFile ? (
          <>
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isUploading}
            >
              <X className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              type="submit"
              size="sm"
              disabled={isUploading}
            >
              {isUploading ? (
                <>Enviando...</>
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Enviar Comprovante
                </>
              )}
            </Button>
          </>
        ) : (
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
          >
            <Upload className="mr-1 h-4 w-4" />
            Selecionar Arquivo
          </Button>
        )}
      </div>
    </form>
  );
}
