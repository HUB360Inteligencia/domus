
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { useProperties } from '@/hooks/use-properties';
import { PropertyList } from '@/components/properties/property-list';
import { PropertyDetail } from '@/components/properties/property-detail';
import { PropertyForm } from '@/components/properties/property-form';
import { PropertyFormData } from '@/types/property';

type PageView = 'list' | 'detail' | 'create' | 'edit';

export default function Properties() {
  const [currentView, setCurrentView] = useState<PageView>('list');
  const {
    properties,
    selectedProperty,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading,
    setSelectedPropertyId,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage
  } = useProperties();

  const handleSelectProperty = (id: string) => {
    setSelectedPropertyId(id);
    setCurrentView('detail');
  };

  const handleAddNew = () => {
    setCurrentView('create');
  };

  const handleCreateSubmit = (data: PropertyFormData) => {
    createProperty(data, {
      onSuccess: (newProperty) => {
        setSelectedPropertyId(newProperty.id);
        setCurrentView('detail');
      }
    });
  };

  const handleUpdateSubmit = (data: PropertyFormData) => {
    if (selectedProperty) {
      updateProperty(
        { id: selectedProperty.id, ...data },
        {
          onSuccess: () => {
            setCurrentView('detail');
          }
        }
      );
    }
  };

  const handleDeleteProperty = () => {
    if (selectedProperty) {
      deleteProperty(selectedProperty.id, {
        onSuccess: () => {
          setCurrentView('list');
        }
      });
    }
  };

  const handleUploadImage = (file: File) => {
    if (selectedProperty) {
      uploadPropertyImage({ id: selectedProperty.id, imageFile: file });
    }
  };

  if (isLoading && currentView === 'detail') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-petroleum" />
      </div>
    );
  }

  return (
    <div>
      {currentView === 'list' && (
        <PropertyList
          properties={properties}
          isLoading={isLoading}
          onSelect={handleSelectProperty}
          onAddNew={handleAddNew}
        />
      )}

      {currentView === 'detail' && (
        <PropertyDetail
          property={selectedProperty}
          isLoading={isLoading}
          onBack={() => setCurrentView('list')}
          onEdit={() => setCurrentView('edit')}
          onDelete={handleDeleteProperty}
          isDeleting={isDeleting}
        />
      )}

      {currentView === 'create' && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Novo Imóvel</h2>
          <PropertyForm
            onSubmit={handleCreateSubmit}
            isLoading={isCreating}
          />
        </div>
      )}

      {currentView === 'edit' && selectedProperty && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Editar Imóvel</h2>
          <PropertyForm
            property={selectedProperty}
            onSubmit={handleUpdateSubmit}
            onUploadImage={handleUploadImage}
            isLoading={isUpdating}
            isUploading={isUploading}
          />
        </div>
      )}
    </div>
  );
}
