
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PropertyFormData } from "@/types/property";
import { createPropertyEnhanced, updatePropertyEnhanced } from "@/api/properties-enhanced";

import { logger } from "@/lib/logger";
export const usePropertyMutationsEnhanced = () => {
  const queryClient = useQueryClient();

  const createPropertyMutation = useMutation({
    mutationFn: createPropertyEnhanced,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      logger.log('Property created successfully:', data.id);
    },
    onError: (error: Error) => {
      logger.error('Create property mutation error:', error);
      throw error; // Re-throw to be handled by the form
    }
  });

  const updatePropertyMutation = useMutation({
    mutationFn: updatePropertyEnhanced,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', data.id] });
      logger.log('Property updated successfully:', data.id);
    },
    onError: (error: Error) => {
      logger.error('Update property mutation error:', error);
      throw error; // Re-throw to be handled by the form
    }
  });

  return {
    createProperty: createPropertyMutation.mutateAsync,
    updateProperty: updatePropertyMutation.mutateAsync,
    isCreating: createPropertyMutation.isPending,
    isUpdating: updatePropertyMutation.isPending,
  };
};
