
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PropertyDetail } from '@/components/properties/property-detail';
import { useProperties } from '@/hooks/use-properties';

export default function PropertyDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const { setSelectedPropertyId, selectedProperty, isLoading, deleteProperty, isDeleting } = useProperties();
  
  useEffect(() => {
    // Extract propertyId from URL query parameters
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setPropertyId(id);
      setSelectedPropertyId(id);
    } else {
      // If no ID is provided in the URL, redirect to the properties list
      navigate('/properties');
    }
  }, [location.search, setSelectedPropertyId, navigate]);

  const handleBack = () => {
    navigate('/properties');
  };

  const handleEdit = () => {
    navigate(`/properties/edit?id=${propertyId}`);
  };

  const handleDelete = async () => {
    if (propertyId) {
      await deleteProperty(propertyId);
      navigate('/properties');
    }
  };

  return (
    <PropertyDetail
      property={selectedProperty}
      isLoading={isLoading}
      onBack={handleBack}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );
}
