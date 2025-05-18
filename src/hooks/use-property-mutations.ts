
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PropertyFormData } from "@/types/property";
import { createProperty, updateProperty, deleteProperty, uploadPropertyImage } from "@/api/properties";

export const usePropertyMutations = () => {
  const queryClient = useQueryClient();

  const createPropertyMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Imóvel criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar imóvel: ${error.message}`);
    }
  });

  const updatePropertyMutation = useMutation({
    mutationFn: updateProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Imóvel atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar imóvel: ${error.message}`);
    }
  });

  const deletePropertyMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Imóvel excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir imóvel: ${error.message}`);
    }
  });

  const uploadPropertyImageMutation = useMutation({
    mutationFn: uploadPropertyImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    }
  });

  return {
    createProperty: createPropertyMutation.mutateAsync,
    updateProperty: updatePropertyMutation.mutate,
    deleteProperty: deletePropertyMutation.mutate,
    uploadPropertyImage: uploadPropertyImageMutation.mutate,
    isCreating: createPropertyMutation.isPending,
    isUpdating: updatePropertyMutation.isPending,
    isDeleting: deletePropertyMutation.isPending,
    isUploading: uploadPropertyImageMutation.isPending,
  };
};
