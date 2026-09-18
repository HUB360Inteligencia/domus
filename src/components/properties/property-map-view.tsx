import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle, Loader2, MapPin, RefreshCw } from 'lucide-react';
import type { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { createPropertyPopupContent } from '@/lib/property-map-dom';
import { hasValidCoordinates } from '@/lib/property-map-data';
import { fitMapToProperties } from '@/lib/mapbox-map';

interface PropertyMapViewProps {
  properties: Property[];
  onSelect: (propertyId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: '#4a7c59',
  rented: '#6f8f74',
  airbnb: '#c4934f',
  maintenance: '#f59e0b',
  sold: '#78716c',
};

export function PropertyMapView({ properties, onSelect }: PropertyMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { token, isConfigured, isLoading: isContextLoading, error: contextError } = useMapbox();
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const propertiesWithCoordinates = useMemo(
    () => properties.filter(hasValidCoordinates),
    [properties],
  );

  useEffect(() => {
    if (!token || !mapContainer.current) return;

    setIsMapLoaded(false);
    setMapError(null);
    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-46.633308, -23.55052],
      zoom: 10,
      attributionControl: false,
    });
    map.current = mapInstance;
    let didLoad = false;
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapInstance.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    mapInstance.on('load', () => {
      didLoad = true;
      setMapError(null);
      setIsMapLoaded(true);
    });
    mapInstance.on('error', (event) => {
      if (didLoad) return;
      setMapError(event.error?.message || 'Erro ao carregar o mapa.');
      setIsMapLoaded(false);
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      mapInstance.remove();
      map.current = null;
    };
  }, [retryKey, token]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !isMapLoaded) return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = propertiesWithCoordinates.map((property) => {
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'property-marker rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500';
      markerElement.setAttribute('aria-label', `Abrir ${property.title}`);
      markerElement.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 9999px;
        background-color: ${STATUS_COLORS[property.status] || '#6b7280'};
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        cursor: pointer;
      `;

      const popup = new mapboxgl.Popup({ offset: 16 }).setDOMContent(
        createPropertyPopupContent(
          {
            id: property.id,
            title: property.title,
            address: property.address,
            city: property.city,
            value: property.value,
            status: property.status,
            type: property.type,
            imageUrl: property.image_url,
          },
          onSelect,
        ),
      );

      return new mapboxgl.Marker({ element: markerElement })
        .setLngLat([property.longitude, property.latitude])
        .setPopup(popup)
        .addTo(mapInstance);
    });

    fitMapToProperties(mapInstance, propertiesWithCoordinates);

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
    };
  }, [isMapLoaded, onSelect, propertiesWithCoordinates]);

  if (isContextLoading) {
    return <MapStatus icon={Loader2} message="Carregando configurações do mapa..." isAnimated />;
  }

  if (!isConfigured || !token) {
    return <MapStatus icon={AlertCircle} message={contextError || 'Token do Mapbox não configurado.'} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <div ref={mapContainer} className="h-full w-full" />

      {!isMapLoaded && !mapError && (
        <MapOverlay icon={Loader2} message="Carregando mapa..." isAnimated />
      )}

      {mapError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 p-4">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{mapError}</p>
            <Button className="mt-4" size="sm" onClick={() => setRetryKey((key) => key + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {isMapLoaded && !mapError && propertiesWithCoordinates.length === 0 && (
        <MapOverlay icon={MapPin} message="Nenhum imóvel com coordenadas válidas para exibir." />
      )}

      {isMapLoaded && propertiesWithCoordinates.length > 0 && (
        <div className="absolute left-4 top-4 rounded-lg bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          {propertiesWithCoordinates.length} imóvel(eis) no mapa
        </div>
      )}
    </div>
  );
}

function MapStatus({
  icon: Icon,
  message,
  isAnimated = false,
}: {
  icon: typeof MapPin;
  message: string;
  isAnimated?: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-muted p-4 text-center">
      <Icon className={`mb-3 h-10 w-10 text-muted-foreground ${isAnimated ? 'animate-spin' : ''}`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function MapOverlay({
  icon: Icon,
  message,
  isAnimated = false,
}: {
  icon: typeof MapPin;
  message: string;
  isAnimated?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 p-4 text-center backdrop-blur-sm">
      <Icon className={`mb-3 h-10 w-10 text-muted-foreground ${isAnimated ? 'animate-spin' : ''}`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
