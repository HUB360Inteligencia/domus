
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { PropertyMapView } from '@/components/properties/property-map-view';
import { useProperties } from '@/hooks/use-properties';
import { Loader2, MapPin } from 'lucide-react';

export default function PropertiesMapPage() {
  const { properties, isLoadingProperties } = useProperties();
  const navigate = useNavigate();

  const handlePropertySelect = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  if (isLoadingProperties) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-2" />
            <p className="text-muted-foreground">Carregando propriedades...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Mapa de Imóveis"
        description="Visualize todas as suas propriedades em um mapa interativo"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{properties.length} propriedades</span>
        </div>
      </PageHeader>

      <div className="w-full h-[600px]">
        <PropertyMapView 
          properties={properties}
          onSelect={handlePropertySelect}
        />
      </div>
    </div>
  );
}
