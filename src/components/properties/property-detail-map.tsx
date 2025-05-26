
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Property } from '@/types/property';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PropertyDetailMapProps {
  property: Property;
}

export const PropertyDetailMap: React.FC<PropertyDetailMapProps> = ({ property }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || !property.latitude || !property.longitude) {
      setIsLoading(false);
      return;
    }

    // Check if Mapbox token is available
    const mapboxToken = localStorage.getItem('mapbox_token') || process.env.MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      setMapError('Token do Mapbox não configurado. Configure o token nas configurações do sistema.');
      setIsLoading(false);
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [property.longitude, property.latitude],
        zoom: 15,
        attributionControl: false,
      });

      // Add marker for the property
      new mapboxgl.Marker({
        color: '#3b82f6',
        scale: 1.2,
      })
        .setLngLat([property.longitude, property.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-sm">${property.title}</h3>
                <p class="text-xs text-gray-600">${property.address}</p>
                ${property.neighborhood ? `<p class="text-xs text-gray-500">${property.neighborhood}</p>` : ''}
              </div>
            `)
        )
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsLoading(false);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Erro ao carregar o mapa. Verifique sua conexão com a internet.');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erro ao inicializar o mapa. Token do Mapbox pode estar inválido.');
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [property.latitude, property.longitude, property.title, property.address, property.neighborhood]);

  if (mapError) {
    return (
      <div className="h-[300px] w-full">
        <Alert className="h-full flex items-center justify-center">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {mapError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!property.latitude || !property.longitude) {
    return (
      <div className="h-[300px] w-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Coordenadas não disponíveis</p>
          <p className="text-sm text-muted-foreground">
            Adicione as coordenadas do imóvel para visualizar o mapa
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[300px] w-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="h-[300px] w-full rounded-lg" />
  );
};
