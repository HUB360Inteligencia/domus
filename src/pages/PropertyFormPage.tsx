
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PropertyForm } from '@/components/properties/property-form';
import { useProperties } from '@/hooks/use-properties';
import { PropertyFormData } from '@/types/property';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    // Check if we're in edit mode by looking for an ID in the URL
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setPropertyId(id);
      setSelectedPropertyId(id);
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
      setPropertyId(null);
    }
  }, [location.search, setSelectedPropertyId]);

  const handleSubmit = async (data: PropertyFormData, imageFile?: File) => {
    try {
      if (isEditMode && propertyId) {
        // Update existing property
        await updateProperty({ id: propertyId, ...data });
        
        // If there's a new image, upload it
        if (imageFile) {
          await uploadPropertyImage({ id: propertyId, imageFile });
        }
        
        navigate('/properties');
      } else {
        // Create new property
        const result = await createProperty(data);
        
        // If there's an image and the property was created successfully
        if (imageFile && result && result.id) {
          await uploadPropertyImage({ id: result.id, imageFile });
        }
        
        navigate('/properties');
      }
    } catch (error) {
      console.error('Error saving property:', error);
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
        initialData={isEditMode ? selectedProperty : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating || isUploading}
      />
    </div>
  );
}
