
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyImages,
  uploadPropertyImageMulti,
  setPrimaryPropertyImage,
  updatePropertyImage,
  deletePropertyImage,
  reorderPropertyImages
} from '@/api/property-images';

export const usePropertyImages = (propertyId: string | null) => {
  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['propertyImages', propertyId],
    queryFn: () => fetchPropertyImages(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ file, description, isPrimary }: { file: File; description?: string; isPrimary?: boolean }) => 
      uploadPropertyImageMulti({
        propertyId: propertyId || '',
        imageFile: file,
        description,
        isPrimary
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    }
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (imageId: string) => setPrimaryPropertyImage(imageId, propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Imagem principal definida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao definir imagem principal: ${error.message}`);
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { description?: string } }) => 
      updatePropertyImage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      toast.success('Imagem atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar imagem: ${error.message}`);
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => deletePropertyImage(imageId, propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Imagem excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir imagem: ${error.message}`);
    }
  });

  const reorderImagesMutation = useMutation({
    mutationFn: (imagesOrder: { id: string; display_order: number }[]) => 
      reorderPropertyImages(imagesOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      toast.success('Ordem das imagens atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reordenar imagens: ${error.message}`);
    }
  });

  return {
    images,
    isLoading,
    isUploading: uploadImageMutation.isPending,
    isUpdating: updateImageMutation.isPending || setPrimaryMutation.isPending || reorderImagesMutation.isPending,
    isDeleting: deleteImageMutation.isPending,
    uploadImage: uploadImageMutation.mutate,
    setPrimaryImage: setPrimaryMutation.mutate,
    updateImage: updateImageMutation.mutate,
    deleteImage: deleteImageMutation.mutate,
    reorderImages: reorderImagesMutation.mutate
  };
};
