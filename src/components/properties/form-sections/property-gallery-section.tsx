
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Images, Upload, X, Star, GripVertical, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PropertyImage } from '@/types/property';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

interface PropertyGallerySectionProps {
  images: PropertyImage[];
  onImagesChange: (images: PropertyImage[]) => void;
  /** Na edição o imóvel já pode ter capa: fotos novas não viram principal automaticamente. */
  isEditing?: boolean;
}

export function PropertyGallerySection({ images, onImagesChange, isEditing = false }: PropertyGallerySectionProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const files = selected.filter(file => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE_BYTES);
    const rejected = selected.length - files.length;
    if (rejected > 0) {
      toast.error(`${rejected} arquivo(s) ignorado(s): envie apenas imagens de até 10MB.`);
    }
    const hasPrimary = images.some(img => img.is_primary);
    const newImages: PropertyImage[] = files.map((file, index) => ({
      name: file.name.replace(/\.[^.]+$/, ''),
      description: '',
      file,
      url: URL.createObjectURL(file),
      // Só a primeira foto de um cadastro novo vira capa automaticamente
      is_primary: !isEditing && !hasPrimary && index === 0,
      display_order: images.length + index
    }));
    
    onImagesChange([...images, ...newImages]);
    e.target.value = '';
  };

  const updateImage = (index: number, updates: Partial<PropertyImage>) => {
    const updatedImages = images.map((img, i) => 
      i === index ? { ...img, ...updates } : img
    );
    onImagesChange(updatedImages);
  };

  const removeImage = (index: number) => {
    const removed = images[index];
    if (removed?.url?.startsWith('blob:')) URL.revokeObjectURL(removed.url);
    const updatedImages = images.filter((_, i) => i !== index);
    // Se removeu a imagem principal (cadastro novo), a primeira restante assume
    if (removed?.is_primary && updatedImages.length > 0 && !isEditing) {
      updatedImages[0] = { ...updatedImages[0], is_primary: true };
    }
    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    onImagesChange(updatedImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedImages = [...images];
    const draggedImage = updatedImages[draggedIndex];
    
    updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(dropIndex, 0, draggedImage);
    
    // Atualizar display_order
    updatedImages.forEach((img, i) => {
      img.display_order = i;
    });
    
    onImagesChange(updatedImages);
    setDraggedIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          Galeria de Fotos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing && (
          <p className="flex items-start gap-2 rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            As fotos já cadastradas ficam na aba "Fotos" do imóvel. Aqui você pode adicionar novas — marque a estrela para torná-la a capa.
          </p>
        )}
        <div>
          <Label htmlFor="image-upload">Adicionar Fotos</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Selecionar Fotos
            </Button>
            <span className="text-sm text-muted-foreground">
              {images.length} foto{images.length !== 1 ? 's' : ''} adicionada{images.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {images.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Arraste as fotos para reordenar. Clique na estrela para definir como foto principal.
            </div>
            
            <div className="grid gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-card cursor-move hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      {image.is_primary && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 px-1 py-0">
                          <Star className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`name-${index}`}>Nome da Foto</Label>
                      <Input
                        id={`name-${index}`}
                        value={image.name}
                        onChange={(e) => updateImage(index, { name: e.target.value })}
                        placeholder="Ex: Sala de estar"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`description-${index}`}>Descrição</Label>
                      <Textarea
                        id={`description-${index}`}
                        value={image.description}
                        onChange={(e) => updateImage(index, { description: e.target.value })}
                        placeholder="Descreva os detalhes desta foto..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPrimaryImage(index)}
                        disabled={image.is_primary}
                        className="flex items-center gap-1"
                      >
                        <Star className="h-3 w-3" />
                        {image.is_primary ? 'Foto Principal' : 'Definir como Principal'}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
