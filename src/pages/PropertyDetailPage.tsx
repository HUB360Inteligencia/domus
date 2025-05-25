
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyDetail } from '@/components/properties/property-detail';
import { useProperties } from '@/hooks/use-properties';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedPropertyId, selectedProperty, isLoading, deleteProperty, isDeleting } = useProperties();
  
  // Use useCallback to stabilize the function reference
  const loadPropertyData = useCallback((propertyId: string) => {
    setSelectedPropertyId(propertyId);
  }, [setSelectedPropertyId]);
  
  useEffect(() => {
    if (id) {
      loadPropertyData(id);
    } else {
      // If no ID is provided in the URL, redirect to the properties list
      navigate('/properties');
    }
  }, [id, navigate, loadPropertyData]);

  const handleBack = () => {
    navigate('/properties');
  };

  const handleEdit = () => {
    navigate(`/properties/${id}/edit`);
  };

  const handleDelete = async () => {
    if (id) {
      deleteProperty(id);
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
