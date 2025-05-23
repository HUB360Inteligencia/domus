
import React, { useState, useRef, useCallback } from 'react';
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Edit, Trash2, Upload, Star } from 'lucide-react';
import { usePropertyImages } from '@/hooks/use-property-images';
import { PropertyImage } from '@/types/property-image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

interface PropertyImageGalleryProps {
  propertyId: string | null;
  isLoading?: boolean;
}

const formSchema = z.object({
  description: z.string().optional(),
});

export const PropertyImageGallery = ({ propertyId, isLoading }: PropertyImageGalleryProps) => {
  const {
    images,
    isLoadingImages,
    isUploading,
    uploadImage,
    setAsPrimary,
    deleteImage,
    updateDescription,
    isGalleryOpen,
    currentImageIndex,
    openGallery,
    closeGallery,
    nextImage,
    prevImage,
  } = usePropertyImages(propertyId);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadImage(file);
      e.target.value = ''; // Reset input
    }
  };
  
  const handleEditImage = (image: PropertyImage) => {
    setSelectedImage(image);
    form.setValue('description', image.description || '');
    setIsEditDialogOpen(true);
  };
  
  const handleSaveDescription = async (values: z.infer<typeof formSchema>) => {
    if (selectedImage) {
      await updateDescription(selectedImage.id, values.description || '');
      setIsEditDialogOpen(false);
      setSelectedImage(null);
    }
  };
  
  const handleDelete = (image: PropertyImage) => {
    if (window.confirm('Tem certeza que deseja excluir esta imagem?')) {
      deleteImage(image.id);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Imagens do Imóvel</h3>
        <Button onClick={handleUploadClick} disabled={!propertyId || isLoading}>
          <Upload className="h-4 w-4 mr-2" />
          Adicionar Imagem
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>
      
      {isLoadingImages || isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          <p className="text-muted-foreground">
            Nenhuma imagem adicionada. Clique em "Adicionar Imagem" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={image.image_url}
                  alt={image.description || `Imagem ${index + 1}`}
                  className="w-full h-full object-cover aspect-square cursor-pointer"
                  onClick={() => openGallery(index)}
                />
                {image.is_primary && (
                  <Badge className="absolute top-2 left-2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.is_primary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAsPrimary(image.id)}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Principal
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditImage(image)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Full-screen gallery modal */}
      <Dialog open={isGalleryOpen} onOpenChange={closeGallery}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Galeria de Imagens</DialogTitle>
          </DialogHeader>
          
          <div className="flex-grow relative overflow-hidden">
            {images.length > 0 && currentImageIndex < images.length && (
              <img
                src={images[currentImageIndex].image_url}
                alt={images[currentImageIndex].description || `Imagem ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}
            
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div>
              {images.length > 0 && currentImageIndex < images.length && (
                <p className="text-sm text-muted-foreground">
                  {images[currentImageIndex].description || 'Sem descrição'}
                </p>
              )}
            </div>
            <div className="text-sm">
              {images.length > 0 ? `${currentImageIndex + 1} / ${images.length}` : '0 / 0'}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit image dialog */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Descrição da Imagem</SheetTitle>
          </SheetHeader>
          
          {selectedImage && (
            <div className="py-4">
              <img
                src={selectedImage.image_url}
                alt="Imagem selecionada"
                className="w-full h-64 object-contain mb-4"
              />
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveDescription)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Adicione uma descrição para esta imagem"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <SheetFooter>
                    <Button type="submit">Salvar Alterações</Button>
                  </SheetFooter>
                </form>
              </Form>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
