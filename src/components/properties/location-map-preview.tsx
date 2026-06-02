import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertCircle } from 'lucide-react';
import { useMapbox } from '@/contexts/MapboxContext';

interface LocationMapPreviewProps {
  latitude?: number | null;
  longitude?: number | null;
  /** Texto opcional exibido no popup do marcador. */
  label?: string;
  className?: string;
}

/**
 * Pré-visualização do imóvel no mapa (Mapbox). Mostra um marcador na posição
 * geocodificada a partir do endereço/CEP. Substitui a exibição crua de
 * latitude/longitude por uma visualização real do local.
 */
export function LocationMapPreview({
  latitude,
  longitude,
  label,
  className,
}: LocationMapPreviewProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { token, isConfigured } = useMapbox();

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  useEffect(() => {
    if (!isConfigured || !token || !hasCoords || !container.current) return;

    const center: [number, number] = [longitude as number, latitude as number];
    mapboxgl.accessToken = token;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: container.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: 15,
        attributionControl: false,
      });
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      marker.current = new mapboxgl.Marker({ color: '#b45309' }).setLngLat(center).addTo(map.current);
      // Garante o redimensionamento correto quando o container acabou de aparecer.
      map.current.on('load', () => map.current?.resize());
    } else {
      map.current.flyTo({ center, zoom: 15, duration: 800 });
      marker.current?.setLngLat(center);
    }

    if (marker.current && label) {
      marker.current.setPopup(new mapboxgl.Popup({ offset: 16, closeButton: false }).setText(label));
    }
  }, [token, isConfigured, hasCoords, latitude, longitude, label]);

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
      <div
        className={`flex h-64 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-center text-sm text-muted-foreground ${className ?? ''}`}
      >
        <MapPin className="h-8 w-8" />
        <p>Digite o CEP e o número para visualizar o imóvel no mapa.</p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div
        className={`flex h-64 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-center text-sm text-muted-foreground ${className ?? ''}`}
      >
        <AlertCircle className="h-8 w-8" />
        <p>Mapa indisponível: token do Mapbox não configurado.</p>
      </div>
    );
  }

  return <div ref={container} className={`h-64 w-full overflow-hidden rounded-lg ${className ?? ''}`} />;
}
