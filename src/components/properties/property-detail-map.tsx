
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/types/property';
import { MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMapbox } from '@/contexts/MapboxContext';

interface PropertyDetailMapProps {
  property: Property;
}

export const PropertyDetailMap: React.FC<PropertyDetailMapProps> = ({ property }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { token, isConfigured } = useMapbox();

  const hasCoords =
    typeof property.latitude === 'number' &&
    typeof property.longitude === 'number' &&
    !Number.isNaN(property.latitude) &&
    !Number.isNaN(property.longitude);

  useEffect(() => {
    if (!isConfigured || !token || !hasCoords || !mapContainer.current) return;

    const center: [number, number] = [property.longitude as number, property.latitude as number];
    mapboxgl.accessToken = token;

    const popupHtml = `
      <div class="p-2">
        <h3 class="font-semibold text-sm">${property.title}</h3>
        <p class="text-xs text-gray-600">${property.address}</p>
        ${property.neighborhood ? `<p class="text-xs text-gray-500">${property.neighborhood}</p>` : ''}
      </div>
    `;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: 15,
        attributionControl: false,
      });
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      marker.current = new mapboxgl.Marker({ color: '#3b82f6', scale: 1.2 })
        .setLngLat(center)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
        .addTo(map.current);
      // Garante o redimensionamento correto quando o container acabou de aparecer.
      map.current.on('load', () => map.current?.resize());
    } else {
      map.current.flyTo({ center, zoom: 15, duration: 800 });
      marker.current?.setLngLat(center);
      marker.current?.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml));
    }
  }, [token, isConfigured, hasCoords, property.latitude, property.longitude, property.title, property.address, property.neighborhood]);

  // Destrói o mapa ao desmontar.
  useEffect(() => {
    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  if (!hasCoords) {
    return (
      <div className="h-full min-h-[360px] w-full bg-muted flex items-center justify-center">
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

  if (!isConfigured) {
    return (
      <div className="h-full min-h-[360px] w-full">
        <Alert className="h-full flex items-center justify-center">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Token do Mapbox não configurado. Configure o token nas configurações do sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="h-full min-h-[360px] w-full" />
  );
};
