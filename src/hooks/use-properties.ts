
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFormData, PropertyStatus } from '@/types/property';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export const useProperties = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const fetchProperties = async (): Promise<Property[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw new Error(error.message);
    }

    // Transform the data to ensure status is of type PropertyStatus
    return (data || []).map(item => ({
      ...item,
      status: item.status as PropertyStatus
    }));
  };

  const fetchPropertyById = async (id: string): Promise<Property | null> => {
    if (!user || !id) return null;
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching property ${id}:`, error);
      throw new Error(error.message);
    }

    // Transform the data to ensure status is of type PropertyStatus
    return data ? {
      ...data,
      status: data.status as PropertyStatus
    } : null;
  };

  const createProperty = async (propertyData: PropertyFormData): Promise<Property> => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          ...propertyData,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      throw new Error(error.message);
    }

    // Transform the data to ensure status is of type PropertyStatus
    return {
      ...data,
      status: data.status as PropertyStatus
    };
  };

  const updateProperty = async ({ id, ...propertyData }: PropertyFormData & { id: string }): Promise<Property> => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating property ${id}:`, error);
      throw new Error(error.message);
    }

    // Transform the data to ensure status is of type PropertyStatus
    return {
      ...data,
      status: data.status as PropertyStatus
    };
  };

  const deleteProperty = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting property ${id}:`, error);
      throw new Error(error.message);
    }
  };

  const uploadPropertyImage = async ({ id, imageFile }: { id: string; imageFile: File }): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    const filePath = `${user.id}/${id}/${Date.now()}-${imageFile.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('property_images')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from('property_images')
      .getPublicUrl(filePath);

    // Update property with image URL
    const { error: updateError } = await supabase
      .from('properties')
      .update({ image_url: urlData.publicUrl })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating property with image URL:', updateError);
      throw new Error(updateError.message);
    }

    return urlData.publicUrl;
  };

  // Queries and mutations
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const propertyQuery = useQuery({
    queryKey: ['property', selectedPropertyId],
    queryFn: () => fetchPropertyById(selectedPropertyId as string),
    enabled: !!selectedPropertyId,
  });

  const createPropertyMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Imóvel criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar imóvel: ${error.message}`);
    }
  });

  const updatePropertyMutation = useMutation({
    mutationFn: updateProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', selectedPropertyId] });
      toast.success('Imóvel atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar imóvel: ${error.message}`);
    }
  });

  const deletePropertyMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Imóvel excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir imóvel: ${error.message}`);
    }
  });

  const uploadPropertyImageMutation = useMutation({
    mutationFn: uploadPropertyImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', selectedPropertyId] });
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    }
  });

  return {
    properties: propertiesQuery.data || [],
    selectedProperty: propertyQuery.data,
    isLoading: propertiesQuery.isLoading || propertyQuery.isLoading,
    isCreating: createPropertyMutation.isPending,
    isUpdating: updatePropertyMutation.isPending,
    isDeleting: deletePropertyMutation.isPending,
    isUploading: uploadPropertyImageMutation.isPending,
    setSelectedPropertyId,
    createProperty: async (data: PropertyFormData): Promise<Property> => {
      return await createPropertyMutation.mutateAsync(data);
    },
    updateProperty: updatePropertyMutation.mutate,
    deleteProperty: deletePropertyMutation.mutate,
    uploadPropertyImage: uploadPropertyImageMutation.mutate,
  };
};
