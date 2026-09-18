import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle, Loader2, MapPin, RefreshCw } from 'lucide-react';
import type { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { createPropertyPopupContent } from '@/lib/property-map-dom';
import { hasValidCoordinates } from '@/lib/property-map-data';

interface PropertyDetailMapProps {
  property: Property;
}

export function PropertyDetailMap({ property }: PropertyDetailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { token, isConfigured, isLoading: isContextLoading, error: contextError } = useMapbox();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const hasCoordinates = hasValidCoordinates(property);

  useEffect(() => {
    if (!token || !hasCoordinates || !mapContainer.current) return;

    setIsMapLoaded(false);
    setMapError(null);
    mapboxgl.accessToken = token;
    const center: [number, number] = [property.longitude, property.latitude];
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 15,
      attributionControl: false,
    });
    map.current = mapInstance;
    let didLoad = false;
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    marker.current = new mapboxgl.Marker({ color: '#3b82f6', scale: 1.2 })
      .setLngLat(center)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setDOMContent(
          createPropertyPopupContent({
            id: property.id,
            title: property.title,
            address: property.address,
            city: property.city,
            value: property.value,
            status: property.status,
            type: property.type,
          }),
        ),
      )
      .addTo(mapInstance);

    mapInstance.on('load', () => {
      didLoad = true;
      setMapError(null);
      mapInstance.resize();
      setIsMapLoaded(true);
    });
    mapInstance.on('error', (event) => {
      if (didLoad) return;
      setMapError(event.error?.message || 'Erro ao carregar o mapa do imóvel.');
      setIsMapLoaded(false);
    });

    return () => {
      marker.current?.remove();
      marker.current = null;
      mapInstance.remove();
      map.current = null;
    };
  }, [hasCoordinates, property, retryKey, token]);

  if (!hasCoordinates) {
    return <DetailMapStatus icon={MapPin} message="Adicione coordenadas válidas para visualizar o mapa." />;
  }

  if (isContextLoading) {
    return <DetailMapStatus icon={Loader2} message="Carregando configurações do mapa..." isAnimated />;
  }

  if (!isConfigured || !token) {
    return <DetailMapStatus icon={AlertCircle} message={contextError || 'Token do Mapbox não configurado.'} />;
  }

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden">
      <div ref={mapContainer} className="h-full min-h-[360px] w-full" />
      {!isMapLoaded && !mapError && (
        <DetailMapOverlay icon={Loader2} message="Carregando mapa..." isAnimated />
      )}
      {mapError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 p-4 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{mapError}</p>
          <Button className="mt-4" size="sm" onClick={() => setRetryKey((key) => key + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailMapStatus({
  icon: Icon,
  message,
  isAnimated = false,
}: {
  icon: typeof MapPin;
  message: string;
  isAnimated?: boolean;
}) {
  return (
    <div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center bg-muted p-4 text-center">
      <Icon className={`mb-3 h-10 w-10 text-muted-foreground ${isAnimated ? 'animate-spin' : ''}`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function DetailMapOverlay(props: Parameters<typeof DetailMapStatus>[0]) {
  return (
    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm">
      <DetailMapStatus {...props} />
    </div>
  );
}
