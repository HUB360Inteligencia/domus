
import { useState, useRef } from 'react';
import { CameraIcon, ImageIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ReceiptUploadMobileProps {
  onFileSelect: (file: File) => void;
  initialPreview?: string | null;
  className?: string;
}

export const ReceiptUploadMobile = ({ 
  onFileSelect, 
  initialPreview = null,
  className = ''
}: ReceiptUploadMobileProps) => {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('O arquivo precisa ser uma imagem');
      return;
    }

    // Size check (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('A imagem é muito grande (máximo 10MB)');
      return;
    }

    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setIsUploading(false);
      onFileSelect(file);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openGallery = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const openCamera = () => {
    if (cameraInputRef.current) cameraInputRef.current.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <Card className="relative p-1 border-dashed border-2">
        {!preview ? (
          <div className="flex flex-col items-center p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Adicione uma foto do comprovante
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={openGallery}
                className="flex items-center space-x-2"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Galeria</span>
              </Button>
              <Button 
                variant="outline" 
                type="button" 
                onClick={openCamera}
                className="flex items-center space-x-2"
              >
                <CameraIcon className="h-4 w-4" />
                <span>Câmera</span>
              </Button>
            </div>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <Input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative">
            <img 
              src={preview} 
              alt="Comprovante" 
              className="w-full h-auto rounded-md object-contain max-h-96" 
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleClearImage}
              className="absolute top-2 right-2 w-8 h-8 rounded-full"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="mt-2 text-sm">Carregando imagem...</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
