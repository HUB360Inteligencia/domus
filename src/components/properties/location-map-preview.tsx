import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { hasValidCoordinates } from '@/lib/property-map-data';

interface LocationMapPreviewProps {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  className?: string;
}

export function LocationMapPreview({
  latitude,
  longitude,
  label,
  className,
}: LocationMapPreviewProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { token, isConfigured, isLoading: isContextLoading, error: contextError } = useMapbox();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const coordinates = { latitude, longitude };
  const hasCoordinates = hasValidCoordinates(coordinates);

  useEffect(() => {
    if (!token || !hasCoordinates || !container.current) return;

    setIsMapLoaded(false);
    setMapError(null);
    mapboxgl.accessToken = token;
    const center: [number, number] = [longitude, latitude];
    const mapInstance = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 15,
      attributionControl: false,
    });
    map.current = mapInstance;
    let didLoad = false;
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const popup = label
      ? new mapboxgl.Popup({ offset: 16, closeButton: false }).setText(label)
      : undefined;
    marker.current = new mapboxgl.Marker({ color: '#b45309' }).setLngLat(center);
    if (popup) marker.current.setPopup(popup);
    marker.current.addTo(mapInstance);

    mapInstance.on('load', () => {
      didLoad = true;
      setMapError(null);
      mapInstance.resize();
      setIsMapLoaded(true);
    });
    mapInstance.on('error', (event) => {
      if (didLoad) return;
      setMapError(event.error?.message || 'Erro ao carregar a prévia do mapa.');
      setIsMapLoaded(false);
    });

    return () => {
      marker.current?.remove();
      marker.current = null;
      mapInstance.remove();
      map.current = null;
    };
  }, [hasCoordinates, label, latitude, longitude, retryKey, token]);

  if (!hasCoordinates) {
    return (
      <PreviewStatus
        className={className}
        icon={MapPin}
        message="Digite o CEP e o número para visualizar o imóvel no mapa."
      />
    );
  }

  if (isContextLoading) {
    return <PreviewStatus className={className} icon={Loader2} message="Carregando mapa..." isAnimated />;
  }

  if (!isConfigured || !token) {
    return (
      <PreviewStatus
        className={className}
        icon={AlertCircle}
        message={contextError || 'Mapa indisponível: token do Mapbox não configurado.'}
      />
    );
  }

  return (
    <div className={`relative h-64 w-full overflow-hidden rounded-lg ${className || ''}`}>
      <div ref={container} className="h-full w-full" />
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
          <PreviewStatus icon={Loader2} message="Carregando mapa..." isAnimated />
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 p-4 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{mapError}</p>
          <Button className="mt-3" size="sm" onClick={() => setRetryKey((key) => key + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

function PreviewStatus({
  icon: Icon,
  message,
  className,
  isAnimated = false,
}: {
  icon: typeof MapPin;
  message: string;
  className?: string;
  isAnimated?: boolean;
}) {
  return (
    <div
      className={`flex h-64 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground ${className || ''}`}
    >
      <Icon className={`h-8 w-8 ${isAnimated ? 'animate-spin' : ''}`} />
      <p>{message}</p>
    </div>
  );
}
