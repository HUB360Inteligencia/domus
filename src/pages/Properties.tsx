
import { useNavigate } from 'react-router-dom';
import { PropertyList } from '@/components/properties/property-list';
import { useProperties } from '@/hooks/use-properties';

export default function Properties() {
  const navigate = useNavigate();
  const { properties, isLoading } = useProperties();

  const handleSelectProperty = (id: string) => {
    navigate(`/properties/detail?id=${id}`);
  };

  const handleAddNewProperty = () => {
    navigate('/properties/new');
  };

  // Show the property list
  return (
    <PropertyList
      properties={properties}
      isLoading={isLoading}
      onSelect={handleSelectProperty}
      onAddNew={handleAddNewProperty}
    />
  );
}
