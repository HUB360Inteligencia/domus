
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PropertyDetail } from '@/components/properties/property-detail';
import { useProperties } from '@/hooks/use-properties';

export default function PropertyDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const { setSelectedPropertyId, selectedProperty, isLoading, deleteProperty, isDeleting } = useProperties();
  
  // Use useCallback to stabilize the function reference
  const loadPropertyData = useCallback((id: string) => {
    setSelectedPropertyId(id);
  }, [setSelectedPropertyId]);
  
  useEffect(() => {
    // Extract propertyId from URL query parameters
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      setPropertyId(id);
      loadPropertyData(id);
    } else {
      // If no ID is provided in the URL, redirect to the properties list
      navigate('/properties');
    }
  }, [location.search, navigate, loadPropertyData]);

  const handleBack = () => {
    navigate('/properties');
  };

  const handleEdit = () => {
    navigate(`/properties/edit?id=${propertyId}`);
  };

  const handleDelete = async () => {
    if (propertyId) {
      // Pass the id as an argument to the deleteProperty function
      deleteProperty(propertyId);
      navigate('/properties');
    }
  };

  // The PropertyDetail component doesn't need props directly passed to it anymore
  // It will use hooks internally to get the property data
  return (
    <PropertyDetail />
  );
}
