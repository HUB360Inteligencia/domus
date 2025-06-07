
import { useState } from 'react';
import { toast } from 'sonner';
import { PropertyFormData } from '@/types/property';
import { usePropertyMutationsEnhanced } from './use-property-mutations-enhanced';
import { uploadPropertyImage as apiUploadPropertyImage } from '@/api/property-images';

export const usePropertyFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProperty, updateProperty } = usePropertyMutationsEnhanced();

  const validateFormData = (data: PropertyFormData): string[] => {
    const errors: string[] = [];
    
    if (!data.title?.trim()) errors.push('Título é obrigatório');
    if (!data.address?.trim()) errors.push('Endereço é obrigatório');
    if (!data.city?.trim()) errors.push('Cidade é obrigatória');
    if (!data.state?.trim()) errors.push('Estado é obrigatório');
    if (!data.type?.trim()) errors.push('Tipo da propriedade é obrigatório');
    if (!data.status?.trim()) errors.push('Status é obrigatório');
    if (typeof data.value !== 'number' || data.value <= 0) {
      errors.push('Valor deve ser um número maior que zero');
    }
    
    return errors;
  };

  const sanitizeFormData = (data: PropertyFormData): PropertyFormData => {
    // Remove undefined/null values and sanitize data
    const sanitized = { ...data };
    
    // Convert empty strings to null for optional fields
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key as keyof PropertyFormData];
      if (value === '' || value === undefined) {
        (sanitized as any)[key] = null;
      }
    });

    // Ensure numeric fields are properly typed
    sanitized.value = Number(sanitized.value) || 0;
    sanitized.rental_value = sanitized.rental_value ? Number(sanitized.rental_value) : null;
    sanitized.area = sanitized.area ? Number(sanitized.area) : null;
    sanitized.land_area = sanitized.land_area ? Number(sanitized.land_area) : null;
    sanitized.bedrooms = sanitized.bedrooms ? Number(sanitized.bedrooms) : null;
    sanitized.bathrooms = sanitized.bathrooms ? Number(sanitized.bathrooms) : null;
    sanitized.garage_spots = sanitized.garage_spots ? Number(sanitized.garage_spots) : null;
    sanitized.condo_fee = sanitized.condo_fee ? Number(sanitized.condo_fee) : null;
    sanitized.floor_number = sanitized.floor_number ? Number(sanitized.floor_number) : null;
    sanitized.purchase_value = sanitized.purchase_value ? Number(sanitized.purchase_value) : null;

    return sanitized;
  };

  const uploadImages = async (propertyId: string, images: any[]): Promise<void> => {
    if (!images || images.length === 0) return;

    console.log(`Uploading ${images.length} images for property ${propertyId}`);
    
    for (const image of images) {
      if (!image.file) continue;
      
      try {
        await apiUploadPropertyImage(propertyId, image.file, {
          description: image.description || image.name,
          is_primary: image.is_primary || false
        });
        console.log(`Image uploaded successfully: ${image.name}`);
      } catch (error) {
        console.error(`Failed to upload image ${image.name}:`, error);
        toast.error(`Erro ao enviar imagem ${image.name}`);
        // Continue with other images even if one fails
      }
    }
  };

  const submitProperty = async (
    data: PropertyFormData, 
    isEditing: boolean = false, 
    propertyId?: string
  ): Promise<string | null> => {
    setIsSubmitting(true);
    
    try {
      // Step 1: Validate form data
      console.log('Validating form data...');
      const validationErrors = validateFormData(data);
      if (validationErrors.length > 0) {
        toast.error(`Erros de validação: ${validationErrors.join(', ')}`);
        return null;
      }

      // Step 2: Sanitize data
      console.log('Sanitizing form data...');
      const sanitizedData = sanitizeFormData(data);
      
      // Step 3: Prepare data for submission (remove images from main data)
      const { images, ...propertyData } = sanitizedData;
      
      console.log('Property data to submit:', propertyData);

      // Step 4: Create or update property
      let resultPropertyId: string;
      
      if (isEditing && propertyId) {
        console.log(`Updating property ${propertyId}...`);
        const updatedProperty = await updateProperty({ id: propertyId, ...propertyData });
        resultPropertyId = updatedProperty.id;
        toast.success('Propriedade atualizada com sucesso!');
      } else {
        console.log('Creating new property...');
        const newProperty = await createProperty(propertyData);
        resultPropertyId = newProperty.id;
        toast.success('Propriedade criada com sucesso!');
      }

      // Step 5: Upload images (separate operation)
      if (images && images.length > 0) {
        console.log('Starting image upload process...');
        try {
          await uploadImages(resultPropertyId, images);
          toast.success('Imagens enviadas com sucesso!');
        } catch (error) {
          console.error('Image upload failed:', error);
          toast.warning('Propriedade salva, mas houve erro no upload das imagens');
        }
      }

      return resultPropertyId;
      
    } catch (error: any) {
      console.error('Property submission failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Erro ao salvar propriedade';
      
      if (error.message?.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message?.includes('auth')) {
        errorMessage = 'Erro de autenticação. Faça login novamente.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Sem permissão para realizar esta operação.';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
      return null;
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitProperty,
    isSubmitting
  };
};
