
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePropertyImages } from '@/hooks/use-property-images';
import { PropertyImage } from '@/types/property-image';
import { Loader2, Upload, X, Star, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface PropertyImageGalleryProps {
  propertyId: string;
}

interface SortableImageProps {
  image: PropertyImage;
  onSetPrimary: (id: string) => void;
  onEdit: (image: PropertyImage) => void;
  onDelete: (id: string) => void;
}

const SortableImage = ({ image, onSetPrimary, onEdit, onDelete }: SortableImageProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="relative w-24 h-24 border rounded-md overflow-hidden group"
    >
      <img 
        src={image.image_url} 
        alt={image.description || "Property image"} 
        className={`w-full h-full object-cover ${image.is_primary ? 'ring-2 ring-primary' : ''}`}
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        <button 
          onClick={() => onSetPrimary(image.id)}
          className="p-1 bg-amber-500 rounded-full hover:bg-amber-600"
          title="Set as primary"
        >
          <Star className="w-3 h-3 text-white" />
        </button>
        <button 
          onClick={() => onEdit(image)}
          className="p-1 bg-blue-500 rounded-full hover:bg-blue-600"
          title="Edit description"
        >
          <Pencil className="w-3 h-3 text-white" />
        </button>
        <button 
          onClick={() => onDelete(image.id)}
          className="p-1 bg-red-500 rounded-full hover:bg-red-600"
          title="Delete image"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
      {image.is_primary && (
        <div className="absolute bottom-0 left-0 right-0 bg-primary text-xs text-white text-center">
          Principal
        </div>
      )}
    </div>
  );
};

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({ propertyId }) => {
  const { 
    images, 
    isLoading, 
    isUploading, 
    isUpdating,
    isDeleting,
    uploadImage, 
    setPrimaryImage,
    updateImage,
    deleteImage,
    reorderImages
  } = usePropertyImages(propertyId);

  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<PropertyImage | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over.id);
      
      const newOrder = arrayMove(images, oldIndex, newIndex);
      
      // Update display order for all affected images
      const updatedImages = newOrder.map((img, index) => ({
        id: img.id,
        display_order: index
      }));
      
      reorderImages(updatedImages);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleSubmitAdd = () => {
    if (imageFile) {
      uploadImage({
        file: imageFile,
        description: imageDescription,
        isPrimary: images.length === 0 // If first image, make it primary
      });
      setImageFile(null);
      setImageDescription('');
      setIsAddDialogOpen(false);
    }
  };

  const handleSubmitEdit = () => {
    if (editingImage) {
      updateImage({
        id: editingImage.id,
        data: { description: imageDescription }
      });
      setEditingImage(null);
      setImageDescription('');
      setIsEditDialogOpen(false);
    }
  };

  const handleSubmitDelete = () => {
    if (deletingImageId) {
      deleteImage(deletingImageId);
      setDeletingImageId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEdit = (image: PropertyImage) => {
    setEditingImage(image);
    setImageDescription(image.description || '');
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingImageId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleViewImage = (index: number) => {
    setSelectedImage(index);
    setIsViewerOpen(true);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Galeria de Imagens</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Imagem</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Imagem
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Descrição da imagem"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmitAdd} 
                  disabled={!imageFile || isUploading}
                >
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="mx-auto h-10 w-10 mb-2" />
            <p>Nenhuma imagem enviada. Clique em Upload para adicionar imagens.</p>
          </div>
        ) : (
          <>
            {/* Main image display */}
            <div className="mb-4 cursor-pointer" onClick={() => setIsViewerOpen(true)}>
              <AspectRatio ratio={16 / 9}>
                <img
                  src={images.find(img => img.is_primary)?.image_url || images[0].image_url}
                  alt="Imagem principal"
                  className="rounded-md w-full h-full object-cover"
                />
              </AspectRatio>
            </div>

            {/* Thumbnail gallery with drag and drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={images.map(img => img.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex overflow-x-auto gap-2 py-2">
                  {images.map((image) => (
                    <SortableImage
                      key={image.id}
                      image={image}
                      onSetPrimary={setPrimaryImage}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Image editor dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Descrição da Imagem</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex justify-center mb-4">
                    <img
                      src={editingImage?.image_url}
                      alt={editingImage?.description || "Property image"}
                      className="h-40 object-contain"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-description" className="text-right">
                      Descrição
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={imageDescription}
                      onChange={(e) => setImageDescription(e.target.value)}
                      className="col-span-3"
                      placeholder="Descrição da imagem"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmitEdit} 
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                </DialogHeader>
                <p>Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleSubmitDelete} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Excluir'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Full screen image viewer */}
            <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
              <DialogContent className="max-w-4xl p-0 bg-black border-0">
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.map((image, index) => (
                      <CarouselItem key={image.id}>
                        <div className="flex flex-col items-center justify-center p-2 h-[80vh]">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img
                              src={image.image_url}
                              alt={image.description || `Imagem ${index + 1}`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          {image.description && (
                            <div className="text-white text-sm mt-2 px-4 py-2 bg-black/50 rounded-md">
                              {image.description}
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};
