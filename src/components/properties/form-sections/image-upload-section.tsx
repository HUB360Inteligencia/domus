
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, ImageIcon } from 'lucide-react';

interface ImageUploadSectionProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

export function ImageUploadSection({ 
  imagePreview, 
  onImageChange, 
  onImageRemove 
}: ImageUploadSectionProps) {
  return (
    <Card className="border-dashed border-2 border-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Imagem Principal do Imóvel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!imagePreview ? (
            <div className="text-center py-8">
              <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <Label htmlFor="image" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    Selecionar Imagem
                  </div>
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview da imagem"
                  className="w-full h-64 object-cover rounded-lg shadow-sm"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onImageRemove}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="image-replace" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm">
                    <Upload className="h-3 w-3" />
                    Trocar Imagem
                  </div>
                </Label>
                <Input
                  id="image-replace"
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
