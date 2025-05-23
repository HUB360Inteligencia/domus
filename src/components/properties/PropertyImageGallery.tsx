import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, X, ChevronsUpDown, GripVertical, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePropertyImages } from '@/hooks/use-property-images';
import { Property, PropertyImage } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const PropertyImageGallery = ({ property, isLoading }: { property: Property | null | undefined; isLoading: boolean }) => {
  const { images, isLoadingImages, uploadImage, uploadImages, setAsPrimary, deleteImage, reorderImages, isUploading, isDeleting } = usePropertyImages(property?.id || null);
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [draggedImage, setDraggedImage] = useState<PropertyImage | null>(null);
  const [description, setDescription] = useState('');
  const [isAddingDescription, setIsAddingDescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenLightbox = useCallback((image: PropertyImage) => {
    setSelectedImage(image);
    setIsLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setSelectedImage(null);
    setIsLightboxOpen(false);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadImages(Array.from(files));
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadImages(Array.from(files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSetPrimary = async (imageId: string) => {
    await setAsPrimary(imageId);
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage(imageId);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleStartAddDescription = (image: PropertyImage) => {
    setSelectedImage(image);
    setDescription(image.description || '');
    setIsAddingDescription(true);
  };

  const handleCancelAddDescription = () => {
    setSelectedImage(null);
    setDescription('');
    setIsAddingDescription(false);
  };

  const handleSaveDescription = async () => {
    if (selectedImage) {
      // Optimistically update the image in the local state
      const updatedImages = images.map(img =>
        img.id === selectedImage.id ? { ...img, description: description } : img
      );
      // Update the images state
      //setImages(updatedImages);

      // Call the API to update the description
      //await updateDescription(selectedImage.id, description);

      // Close the form
      handleCancelAddDescription();
    }
  };

  const handleDragStart = (image: PropertyImage) => {
    setDraggedImage(image);
  };

  const handleDragOverImage = (e: React.DragEvent<HTMLDivElement>, overImage: PropertyImage) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetImage: PropertyImage) => {
    e.preventDefault();

    if (!draggedImage) return;

    // Find the index of the dragged and target images
    const draggedIndex = images.findIndex(img => img.id === draggedImage.id);
    const targetIndex = images.findIndex(img => img.id === targetImage.id);

    if (draggedIndex < 0 || targetIndex < 0) return;

    // Create a copy of the images array
    const newImages = [...images];

    // Remove the dragged image from its original position
    newImages.splice(draggedIndex, 1);

    // Insert the dragged image into the target position
    newImages.splice(targetIndex, 0, draggedImage);

    // Update display orders based on new positions
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      display_order: index
    }));

    // Call the reorderImages function
    await reorderImages(updatedImages);

    // Reset the dragged image
    setDraggedImage(null);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedImages = items.map((image, index) => ({
      ...image,
      display_order: index
    }));

    reorderImages(reorderedImages);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Imagens</CardTitle>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              id="upload"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <Label htmlFor="upload" className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={isLoading || isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? (
                  <>
                    Enviando
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  </>
                ) : 'Enviar Imagens'}
              </Button>
            </Label>
          </div>
        </CardHeader>
        <CardContent
          className="relative p-4 border-dashed border-2 border-muted/50 rounded-md cursor-copy"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-50" />
            <p className="text-sm">Arraste e solte imagens aqui ou clique no botão "Enviar Imagens".</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {isLoadingImages ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="images" direction="horizontal">
                  {(provided) => (
                    <div className="flex space-x-4" {...provided.droppableProps} ref={provided.innerRef}>
                      {images.map((image, index) => (
                        <Draggable key={image.id} draggableId={image.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="relative group"
                            >
                              <AspectRatio ratio={1 / 1} className="w-32">
                                <img
                                  src={image.image_url}
                                  alt={property?.title}
                                  className="w-full h-full object-cover rounded-md"
                                  onClick={() => {
                                    setCurrentImageIndex(index);
                                    handleOpenLightbox(image);
                                  }}
                                />
                              </AspectRatio>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                    <ChevronsUpDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" forceMount>
                                  <DropdownMenuLabel>Opções</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleSetPrimary(image.id)} disabled={image.is_primary}>
                                    Definir como principal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStartAddDescription(image)}>
                                    Editar descrição
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive focus:bg-destructive/20">
                                        Excluir
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Imagem</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => handleDeleteImage(image.id)}
                                          disabled={isDeleting}
                                        >
                                          {isDeleting ? 'Excluindo...' : 'Excluir'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Description Modal */}
      {isAddingDescription && selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Descrição</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Descrição da imagem"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={handleCancelAddDescription}>
                Cancelar
              </Button>
              <Button onClick={handleSaveDescription}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
          <div className="relative max-w-4xl max-h-screen">
            <img
              src={selectedImage.image_url}
              alt={property?.title}
              className="max-w-4xl max-h-screen object-contain rounded-md"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white"
              onClick={handleCloseLightbox}
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="absolute bottom-2 left-2 text-white text-sm">
              {selectedImage.description}
            </div>
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { PropertyImageGallery };
