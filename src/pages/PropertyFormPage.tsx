
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyForm } from '@/components/properties/property-form';
import { useProperties } from '@/hooks/use-properties';
import { PropertyFormData } from '@/types/property';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Optimize property data loading function
  const loadPropertyData = useCallback((propertyId: string) => {
    console.log('Loading property data for ID:', propertyId);
    setSelectedPropertyId(propertyId);
  }, [setSelectedPropertyId]);

  // Optimize the main effect that handles URL changes
  useEffect(() => {
    if (id) {
      console.log('Edit mode detected for property ID:', id);
      loadPropertyData(id);
      setIsEditMode(true);
    } else {
      console.log('Create mode detected');
      setIsEditMode(false);
      setSelectedPropertyId(null);
    }
  }, [id, loadPropertyData, setSelectedPropertyId]);

  // Optimize form submission handler
  const handleSubmit = useCallback(async (data: PropertyFormData, imageFile?: File) => {
    try {
      console.log('Submitting property form:', { isEditMode, propertyId: id, data });
      
      // Filter only fields that exist in the database
      const filteredData: PropertyFormData = {
        title: data.title,
        description: data.description,
        address: data.address,
        property_number: data.property_number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        type: data.type,
        status: data.status,
        value: data.value,
        area: data.area,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        garage_spots: data.garage_spots,
        condo_fee: data.condo_fee,
        floor_number: data.floor_number,
        furnished: data.furnished,
        features: data.features,
        latitude: data.latitude,
        longitude: data.longitude,
        purchase_date: data.purchase_date,
        purchase_value: data.purchase_value,
        tenant_name: data.tenant_name,
        tenant_contact: data.tenant_contact,
        agency_name: data.agency_name,
        agency_responsible: data.agency_responsible,
        agency_contact: data.agency_contact,
        square_meter_value: data.square_meter_value,
        tags: data.tags,
      };

      if (isEditMode && id) {
        console.log('Updating existing property');
        await updateProperty({ id, ...filteredData });
        
        if (imageFile) {
          console.log('Uploading new image');
          await uploadPropertyImage({ id, imageFile });
        }
        
        toast.success('Imóvel atualizado com sucesso!');
        navigate('/properties');
      } else {
        console.log('Creating new property');
        const newProperty = await createProperty(filteredData);
        
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
  }, [isEditMode, id, updateProperty, uploadPropertyImage, createProperty, navigate]);

  // Optimize cancel handler
  const handleCancel = useCallback(() => {
    navigate('/properties');
  }, [navigate]);

  // Show loading state only when necessary
  if (isEditMode && isLoading && !selectedProperty) {
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
        key={selectedProperty?.id || 'new'}
        initialData={isEditMode ? selectedProperty : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating || isUploading}
      />
    </div>
  );
}
