
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  X, 
  Star, 
  StarOff, 
  ChevronRight, 
  ChevronLeft, 
  Pencil, 
  Trash2,
  MoveHorizontal,
  ImageIcon,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Property } from '@/types/property';
import { usePropertyImages } from '@/hooks/use-property-images';

interface PropertyImageGalleryProps {
  property: Property | null | undefined;
  isLoading?: boolean;
  editable?: boolean;
}

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  property,
  isLoading = false,
  editable = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editImageId, setEditImageId] = useState<string | null>(null);
  const [editImageDescription, setEditImageDescription] = useState('');
  
  const {
    images,
    isLoadingImages,
    isUploading,
    isUpdating,
    isDeleting,
    uploadImage,
    setAsPrimary,
    updateDescription,
    deleteImage,
    isGalleryOpen,
    currentImageIndex,
    currentImage,
    openGallery,
    closeGallery,
    nextImage,
    prevImage
  } = usePropertyImages(property?.id || null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Upload each file
    Array.from(files).forEach(file => {
      uploadImage(file);
    });
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditImage = (imageId: string, description: string) => {
    setEditImageId(imageId);
    setEditImageDescription(description || '');
  };

  const handleSaveDescription = () => {
    if (!editImageId) return;
    
    updateDescription(editImageId, editImageDescription);
    setEditImageId(null);
    setEditImageDescription('');
  };

  if (isLoading || isLoadingImages) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40 w-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Imagens do Imóvel</CardTitle>
          {editable && (
            <Button
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              <span>Enviar Imagem</span>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative group aspect-square overflow-hidden rounded-md border cursor-pointer"
                  onClick={() => openGallery(index)}
                >
                  <img
                    src={image.image_url}
                    alt={image.description || `Imagem ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {image.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-xs truncate">
                      {image.description}
                    </div>
                  )}
                  {editable && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!image.is_primary && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAsPrimary(image.id);
                          }}
                          title="Definir como imagem principal"
                          disabled={isUpdating}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditImage(image.id, image.description || '');
                        }}
                        title="Editar descrição"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image.id);
                        }}
                        title="Excluir imagem"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {image.is_primary && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Principal
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {editable && (
                <div 
                  className="border border-dashed rounded-md flex items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-xs">Adicionar imagem</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
              <p>Nenhuma imagem adicionada ainda</p>
              {editable && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar primeira imagem
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={closeGallery}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col p-0">
          <div className="p-4 border-b">
            <DialogTitle>
              {currentImage?.description || `Imagem ${currentImageIndex + 1} de ${images.length}`}
            </DialogTitle>
          </div>
          
          <div className="relative flex-grow overflow-hidden">
            {currentImage && (
              <img
                src={currentImage.image_url}
                alt={currentImage.description || `Imagem ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-2 transform -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              disabled={images.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-2 transform -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              disabled={images.length <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-white/80 hover:bg-white"
              onClick={closeGallery}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`w-16 h-16 flex-shrink-0 cursor-pointer border-2 ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={image.image_url}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Image Description Dialog */}
      <Dialog open={!!editImageId} onOpenChange={(open) => !open && setEditImageId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Editar Descrição</DialogTitle>
          <div className="py-4">
            <Textarea
              value={editImageDescription}
              onChange={(e) => setEditImageDescription(e.target.value)}
              placeholder="Adicione uma descrição para esta imagem"
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditImageId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDescription} disabled={isUpdating}>
              {isUpdating ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
