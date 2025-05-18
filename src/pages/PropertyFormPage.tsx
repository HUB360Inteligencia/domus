
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PropertyForm } from '@/components/properties/property-form';
import { useProperties } from '@/hooks/use-properties';
import { PropertyFormData } from '@/types/property';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { 
    createProperty, 
    updateProperty, 
    setSelectedPropertyId, 
    selectedProperty, 
    isLoading, 
    uploadPropertyImage,
    isCreating,
    isUpdating,
    isUploading
  } = useProperties();

  // Use useCallback to stabilize this function reference
  const loadPropertyData = useCallback((id: string) => {
    console.log('Loading property data for ID:', id);
    setSelectedPropertyId(id);
  }, [setSelectedPropertyId]);

  useEffect(() => {
    // Check if we're in edit mode by looking for an ID in the URL
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      console.log('Edit mode detected for property ID:', id);
      setPropertyId(id);
      loadPropertyData(id);
      setIsEditMode(true);
    } else {
      console.log('Create mode detected');
      setIsEditMode(false);
      setPropertyId(null);
      // Reset selected property when in create mode
      setSelectedPropertyId(null);
    }
  }, [location.search, loadPropertyData, setSelectedPropertyId]);

  // Debug log to track selectedProperty changes
  useEffect(() => {
    if (isEditMode) {
      console.log('Selected property updated:', selectedProperty);
    }
  }, [selectedProperty, isEditMode]);

  const handleSubmit = async (data: PropertyFormData, imageFile?: File) => {
    try {
      if (isEditMode && propertyId) {
        // Update existing property
        console.log('Updating property with data:', { id: propertyId, ...data });
        await updateProperty({ id: propertyId, ...data });
        
        // If there's a new image, upload it
        if (imageFile) {
          console.log('Uploading new image for property');
          await uploadPropertyImage({ id: propertyId, imageFile });
        }
        
        toast.success('Imóvel atualizado com sucesso!');
        navigate('/properties');
      } else {
        // Create new property with proper return handling
        console.log('Creating new property with data:', data);
        const newProperty = await createProperty(data);
        
        // If there's an image and the property was created successfully
        if (imageFile && newProperty && newProperty.id) {
          console.log('Uploading image for new property');
          await uploadPropertyImage({ id: newProperty.id, imageFile });
        }
        
        toast.success('Imóvel criado com sucesso!');
        navigate('/properties');
      }
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Erro ao salvar imóvel: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleCancel = () => {
    navigate('/properties');
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-petroleum mb-4" />
        <p className="text-muted-foreground">Carregando dados do imóvel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {isEditMode ? 'Editar Imóvel' : 'Novo Imóvel'}
      </h1>
      
      <PropertyForm
        key={selectedProperty?.id || 'new'} // Add key to force re-render when changing property
        initialData={isEditMode ? selectedProperty : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating || isUploading}
      />
    </div>
  );
}
