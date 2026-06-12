
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, Edit, Trash2, Upload, Star, Images, X, Maximize2 } from 'lucide-react';
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
  
  // Keyboard navigation for the lightbox (←/→ to navigate, Esc to close)
  useEffect(() => {
    if (!isGalleryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'Escape') closeGallery();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, nextImage, prevImage, closeGallery]);

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
                <button
                  type="button"
                  onClick={() => openGallery(index)}
                  className="relative aspect-square w-full block cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`Abrir imagem ${index + 1} em tela cheia`}
                >
                  <img
                    src={image.image_url}
                    alt={image.description || `Imagem ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Subtle bottom gradient with caption (no centered icons) */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <h4 className="font-medium text-sm line-clamp-1 drop-shadow">
                      {image.description || `Imagem ${index + 1}`}
                    </h4>
                  </div>

                  {/* Expand hint */}
                  <div className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </button>

                {/* Primary badge */}
                {image.is_primary && (
                  <Badge className="absolute top-2 left-2 bg-primary pointer-events-none">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}

                {/* Action buttons — discreet, top-right corner */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!image.is_primary && (
                    <button
                      type="button"
                      title="Definir como principal"
                      onClick={() => setAsPrimary(image.id)}
                      className="h-8 w-8 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Editar descrição"
                    onClick={() => handleEditImage(image)}
                    className="h-8 w-8 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Excluir imagem"
                    onClick={() => handleDelete(image)}
                    className="h-8 w-8 rounded-full bg-black/55 hover:bg-red-600 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
      
      {/* Immersive full-screen lightbox */}
      <Dialog open={isGalleryOpen} onOpenChange={(open) => !open && closeGallery()}>
        <DialogContent className="max-w-none w-screen h-screen sm:max-w-none p-0 gap-0 border-0 rounded-none bg-black/95 shadow-none flex flex-col [&>button]:hidden">
          <DialogTitle className="sr-only">Galeria de Imagens</DialogTitle>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 text-white z-10 shrink-0">
            <span className="text-sm font-medium tabular-nums text-white/80">
              {images.length > 0 ? `${currentImageIndex + 1} / ${images.length}` : '0 / 0'}
            </span>
            <button
              type="button"
              onClick={closeGallery}
              aria-label="Fechar galeria"
              className="h-9 w-9 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main image area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden px-4 sm:px-16 min-h-0">
            {images.length > 0 && currentImageIndex < images.length && (
              <img
                key={images[currentImageIndex].id}
                src={images[currentImageIndex].image_url}
                alt={images[currentImageIndex].description || `Imagem ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none animate-in fade-in duration-200"
                draggable={false}
              />
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Imagem anterior"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Próxima imagem"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Caption */}
          {images.length > 0 && currentImageIndex < images.length && images[currentImageIndex].description && (
            <p className="text-center text-sm text-white/70 px-4 pb-2 shrink-0 line-clamp-2">
              {images[currentImageIndex].description}
            </p>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-4 justify-start sm:justify-center">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => openGallery(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                  className={`relative h-16 w-16 shrink-0 rounded-md overflow-hidden transition-all ${
                    index === currentImageIndex
                      ? 'ring-2 ring-white opacity-100'
                      : 'opacity-50 hover:opacity-90'
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.description || `Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
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
