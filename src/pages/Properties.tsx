import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PropertyList } from '@/components/properties/property-list';
import { PropertyDetail } from '@/components/properties/property-detail';
import { useProperties } from '@/hooks/use-properties';

export default function Properties() {
  const navigate = useNavigate();
  const location = useLocation();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const { 
    properties,
    isLoading,
    setSelectedPropertyId,
    selectedProperty,
    deleteProperty,
    isDeleting
  } = useProperties();

  useEffect(() => {
    // Extract propertyId from URL query parameters
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      setPropertyId(id);
      setSelectedPropertyId(id);
    } else {
      setPropertyId(null);
    }
  }, [location.search, setSelectedPropertyId]);

  const handleSelectProperty = (id: string) => {
    navigate(`/properties?id=${id}`);
  };

  const handleAddNewProperty = () => {
    navigate('/properties/new');
  };

  const handleBackToList = () => {
    navigate('/properties');
  };

  const handleEditProperty = () => {
    if (propertyId) {
      navigate(`/properties/edit?id=${propertyId}`);
    }
  };

  const handleDeleteProperty = async () => {
    if (propertyId) {
      await deleteProperty(propertyId);
      navigate('/properties');
    }
  };

  // If a property ID is present in the URL, show the property detail view
  if (propertyId) {
    return (
      <PropertyDetail
        property={selectedProperty}
        isLoading={isLoading}
        onBack={handleBackToList}
        onEdit={handleEditProperty}
        onDelete={handleDeleteProperty}
        isDeleting={isDeleting}
      />
    );
  }

  // Otherwise show the property list
  return (
    <PropertyList
      properties={properties}
      isLoading={isLoading}
      onSelect={handleSelectProperty}
      onAddNew={handleAddNewProperty}
    />
  );
}
