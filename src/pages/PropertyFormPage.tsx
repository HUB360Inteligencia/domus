
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Memoizar a função para evitar re-criações desnecessárias
  const loadPropertyData = useCallback((id: string) => {
    setSelectedPropertyId(id);
  }, [setSelectedPropertyId]);

  // Memoizar os parâmetros da URL para evitar re-execuções desnecessárias
  const urlParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  useEffect(() => {
    const id = urlParams.get('id');
    if (id) {
      if (propertyId !== id) {
        setPropertyId(id);
        loadPropertyData(id);
        setIsEditMode(true);
      }
    } else {
      if (isEditMode || propertyId) {
        setIsEditMode(false);
        setPropertyId(null);
        setSelectedPropertyId(null);
      }
    }
  }, [urlParams, loadPropertyData, setSelectedPropertyId, propertyId, isEditMode]);

  const handleSubmit = async (data: PropertyFormData, imageFile?: File) => {
    try {
      // Filtrar apenas os campos que existem no banco de dados
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

      if (isEditMode && propertyId) {
        await updateProperty({ id: propertyId, ...filteredData });
        
        if (imageFile) {
          await uploadPropertyImage({ id: propertyId, imageFile });
        }
        
        toast.success('Imóvel atualizado com sucesso!');
        navigate('/properties');
      } else {
        const newProperty = await createProperty(filteredData);
        
        if (imageFile && newProperty && newProperty.id) {
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

  const handleCancel = useCallback(() => {
    navigate('/properties');
  }, [navigate]);

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
        key={selectedProperty?.id || 'new'}
        initialData={isEditMode ? selectedProperty : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating || isUploading}
      />
    </div>
  );
}
