
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PropertyList } from '@/components/properties/property-list';
import { useProperties } from '@/hooks/use-properties';

export default function Properties() {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, isLoading } = useProperties();

  // Check if we need to redirect to property details
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    if (id) {
      navigate(`/properties/${id}`, { replace: true });
    }
  }, [location.search, navigate]);

  const handleSelectProperty = (id: string) => {
    navigate(`/properties/${id}`);
  };

  const handleAddNewProperty = () => {
    navigate('/properties/new');
  };

  return (
    <PropertyList
      properties={properties || []}
      isLoading={isLoading}
      onSelect={handleSelectProperty}
      onAddNew={handleAddNewProperty}
    />
  );
}
