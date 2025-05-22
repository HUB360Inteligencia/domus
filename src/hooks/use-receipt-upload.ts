
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface UseReceiptUploadReturn {
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openCamera: () => void;
}

export function useReceiptUpload(): UseReceiptUploadReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      toast.info(`File ${file.name} selected`);
    }
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    selectedFile,
    fileInputRef,
    handleFileChange,
    openCamera
  };
}
