
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyImages, 
  uploadPropertyImage,
  setPropertyImageAsPrimary,
  updatePropertyImageOrder,
  updatePropertyImageDescription,
  deletePropertyImage
} from '@/api/property-images';
import { PropertyImage, PropertyImageFormData } from '@/types/property-image';

import { logger } from "@/lib/logger";
export const usePropertyImages = (propertyId: string | null) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const queryClient = useQueryClient();

  // Fetch property images
  const {
    data: images = [],
    isLoading: isLoadingImages,
    refetch: refetchImages,
  } = useQuery({
    queryKey: ['property-images', propertyId],
    queryFn: () => fetchPropertyImages(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Upload image
  const uploadImageMutation = useMutation({
    mutationFn: ({ 
      file, 
      description 
    }: { 
      file: File; 
      description?: string;
      isPrimary?: boolean;
    }) => uploadPropertyImage(
      propertyId || '', 
      file, 
      // is_primary indefinido = a API marca como capa automaticamente quando é a primeira foto
      { description }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-images', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    },
  });

  // Set image as primary
  const setPrimaryMutation = useMutation({
    mutationFn: (imageId: string) => setPropertyImageAsPrimary(imageId, propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-images', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Imagem definida como principal!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao definir imagem como principal: ${error.message}`);
    },
  });

  // Update image order
  const updateOrderMutation = useMutation({
    mutationFn: (reorderedImages: Array<{ id: string; display_order: number }>) => 
      updatePropertyImageOrder(reorderedImages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-images', propertyId] });
      toast.success('Ordem das imagens atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar ordem: ${error.message}`);
    },
  });

  // Update image description
  const updateDescriptionMutation = useMutation({
    mutationFn: ({ imageId, description }: { imageId: string; description: string }) => 
      updatePropertyImageDescription(imageId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-images', propertyId] });
      toast.success('Descrição atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar descrição: ${error.message}`);
    },
  });

  // Delete image
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => deletePropertyImage(imageId, propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-images', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Imagem excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir imagem: ${error.message}`);
    },
  });

  // Upload multiple images — em sequência, para a definição da capa/ordem não disputar entre uploads
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const uploadImages = useCallback(
    async (files: File[], description?: string) => {
      if (!propertyId || files.length === 0) return { uploaded: 0, failed: 0 };

      setIsUploadingBatch(true);
      let uploaded = 0;
      let failed = 0;
      try {
        for (const file of files) {
          try {
            await uploadPropertyImage(propertyId, file, { description });
            uploaded += 1;
          } catch (error) {
            failed += 1;
            logger.error('Error uploading image:', error);
          }
        }
      } finally {
        setIsUploadingBatch(false);
        queryClient.invalidateQueries({ queryKey: ['property-images', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['properties'] });
      }

      if (failed === 0) {
        toast.success(uploaded === 1 ? 'Foto enviada com sucesso!' : `${uploaded} fotos enviadas com sucesso!`);
      } else if (uploaded > 0) {
        toast.warning(`${uploaded} de ${files.length} fotos enviadas. Tente novamente as que falharam.`);
      } else {
        toast.error('Não foi possível enviar as fotos. Verifique a conexão e tente novamente.');
      }
      return { uploaded, failed };
    },
    [propertyId, queryClient]
  );

  // Reorder images
  const reorderImages = useCallback(
    (newOrder: PropertyImage[]) => {
      const reorderedImages = newOrder.map((image, index) => ({
        id: image.id,
        display_order: index
      }));

      return updateOrderMutation.mutateAsync(reorderedImages);
    },
    [updateOrderMutation]
  );

  // Gallery controls
  const openGallery = useCallback((index: number = 0) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  return {
    images,
    isLoadingImages,
    isUploading: uploadImageMutation.isPending || isUploadingBatch,
    isUpdating: setPrimaryMutation.isPending || updateOrderMutation.isPending || updateDescriptionMutation.isPending,
    isDeleting: deleteImageMutation.isPending,
    uploadImage: (file: File, description?: string) => 
      uploadImageMutation.mutate({ file, description }),
    uploadImages,
    setAsPrimary: (imageId: string) => setPrimaryMutation.mutate(imageId),
    reorderImages,
    updateDescription: (imageId: string, description: string) => 
      updateDescriptionMutation.mutate({ imageId, description }),
    deleteImage: (imageId: string) => deleteImageMutation.mutate(imageId),
    refetchImages,
    
    // Gallery state and controls
    isGalleryOpen,
    currentImageIndex,
    currentImage: images[currentImageIndex],
    openGallery,
    closeGallery,
    nextImage,
    prevImage,
  };
};
