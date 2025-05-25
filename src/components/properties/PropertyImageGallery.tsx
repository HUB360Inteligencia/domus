
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
import { ChevronLeft, ChevronRight, Edit, Trash2, Upload, Star, Images } from 'lucide-react';
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

const uploadFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
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
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const uploadForm = useForm<z.infer<typeof uploadFormSchema>>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setIsUploadDialogOpen(true);
      e.target.value = ''; // Reset input
    }
  };

  const handleUploadSubmit = async (values: z.infer<typeof uploadFormSchema>) => {
    if (selectedFiles.length === 0) return;

    try {
      for (const file of selectedFiles) {
        await uploadImage(file, values.description || values.name);
      }
      setIsUploadDialogOpen(false);
      setSelectedFiles([]);
      uploadForm.reset();
      toast.success(`${selectedFiles.length} imagem(ns) enviada(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao enviar imagens');
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
        <h3 className="text-lg font-medium">Galeria de Imagens</h3>
        <Button onClick={handleUploadClick} disabled={!propertyId || isLoading}>
          <Upload className="h-4 w-4 mr-2" />
          Adicionar Imagens
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          multiple
        />
      </div>
      
      {isLoadingImages || isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-md">
          <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma imagem adicionada. Clique em "Adicionar Imagens" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={image.image_url}
                    alt={image.description || `Imagem ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => openGallery(index)}
                  />
                  
                  {/* Progressive blur gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {image.is_primary && (
                    <Badge className="absolute top-2 left-2 bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Principal
                    </Badge>
                  )}

                  {/* Image info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {image.description || `Imagem ${index + 1}`}
                    </h4>
                    {image.description && (
                      <p className="text-xs text-white/80 line-clamp-2 mt-1">
                        {image.description}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsPrimary(image.id);
                        }}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Principal
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditImage(image);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Imagens</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedFiles.length} imagem(ns) selecionada(s)
            </p>
            
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(handleUploadSubmit)} className="space-y-4">
                <FormField
                  control={uploadForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome das Imagens</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Sala de estar, Quarto principal..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={uploadForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione observações sobre as imagens..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsUploadDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Enviando...' : 'Enviar Imagens'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
      
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
