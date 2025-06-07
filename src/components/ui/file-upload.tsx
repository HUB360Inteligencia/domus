
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  currentFile?: File | null;
}

export function FileUpload({ 
  onFileSelect, 
  accept = "*/*", 
  maxSizeMB = 5,
  currentFile = null 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
        return;
      }
      
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      
      {currentFile ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
          <span className="text-sm text-gray-700 truncate">{currentFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Arquivo
        </Button>
      )}
      
      <p className="text-xs text-gray-500">
        Tipos aceitos: {accept}. Tamanho máximo: {maxSizeMB}MB
      </p>
    </div>
  );
}
