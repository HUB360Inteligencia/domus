
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyForm } from '@/components/properties/property-form';
import { useProperties } from '@/hooks/use-properties';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { 
    setSelectedPropertyId, 
    selectedProperty, 
    isLoading 
  } = useProperties();

  // Load property data for editing
  useEffect(() => {
    if (id) {
      console.log('Edit mode detected for property ID:', id);
      setSelectedPropertyId(id);
      setIsEditMode(true);
    } else {
      console.log('Create mode detected');
      setIsEditMode(false);
      setSelectedPropertyId(null);
    }
  }, [id, setSelectedPropertyId]);

  const handleSuccess = useCallback((propertyId: string) => {
    console.log('Property saved successfully:', propertyId);
    toast.success(isEditMode ? 'Imóvel atualizado com sucesso!' : 'Imóvel criado com sucesso!');
    navigate('/properties');
  }, [isEditMode, navigate]);

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
        initialData={isEditMode ? selectedProperty : null}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
