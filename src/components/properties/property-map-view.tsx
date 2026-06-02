
import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PropertyMapViewProps {
  properties: Property[];
  onSelect: (propertyId: string) => void;
}

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  apartment: '#3b82f6', // blue
  house: '#10b981', // emerald
  commercial: '#f59e0b', // amber
  land: '#8b5cf6', // violet
  rural: '#06b6d4', // cyan
};

const STATUS_COLORS: Record<string, string> = {
  available: '#10b981', // emerald
  rented: '#3b82f6', // blue
  airbnb: '#ef4444', // red
  maintenance: '#f59e0b', // amber
  sold: '#8b5cf6', // violet
};

export function PropertyMapView({ properties, onSelect }: PropertyMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { token, isConfigured } = useMapbox();
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter properties that have coordinates.
  // Memoized so the markers effect doesn't tear down and rebuild every render.
  const propertiesWithCoords = useMemo(
    () => properties.filter(p => p.latitude !== null && p.longitude !== null),
    [properties]
  );

  useEffect(() => {
    if (!isConfigured) {
      setMapError('Token do Mapbox não configurado');
      return;
    }

    if (!mapContainer.current) return;

    try {
      setIsLoading(true);
      setMapError(null);

      // Initialize Mapbox
      mapboxgl.accessToken = token!;

      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-46.633308, -23.550520], // São Paulo default
        zoom: 10,
        attributionControl: false
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add attribution
      map.current.addControl(new mapboxgl.AttributionControl({
        compact: true
      }), 'bottom-right');

      map.current.on('load', () => {
        setIsLoading(false);
        console.log('Map loaded successfully');
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Erro ao carregar o mapa. Verifique seu token do Mapbox.');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erro ao inicializar o mapa');
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [token, isConfigured]);

  // Add property markers
  useEffect(() => {
    if (!map.current || !isConfigured) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    if (propertiesWithCoords.length === 0) return;

    // Add markers for each property
    propertiesWithCoords.forEach(property => {
      if (property.latitude === null || property.longitude === null) return;

      // Outer element: positioned by Mapbox via inline `transform: translate(...)`.
      // We must NOT touch its transform, or the marker jumps to the map origin.
      const markerElement = document.createElement('div');
      markerElement.className = 'property-marker';

      // Inner element: handles styling and the hover scale animation.
      const markerDot = document.createElement('div');
      markerDot.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${STATUS_COLORS[property.status] || '#6b7280'};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: transform 0.2s;
      `;
      markerElement.appendChild(markerDot);

      markerElement.addEventListener('mouseenter', () => {
        markerDot.style.transform = 'scale(1.2)';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerDot.style.transform = 'scale(1)';
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 15,
        closeButton: false,
        closeOnClick: false
      });

      const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
      };

      const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
          available: 'Disponível',
          rented: 'Alugado',
          airbnb: 'Airbnb',
          maintenance: 'Em manutenção',
          sold: 'Vendido',
        };
        return labels[status] || status;
      };

      const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
          apartment: 'Apartamento',
          house: 'Casa',
          commercial: 'Comercial',
          land: 'Terreno',
          rural: 'Rural',
        };
        return labels[type] || type;
      };

      popup.setHTML(`
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-sm mb-1">${property.title}</h3>
          <p class="text-xs text-gray-600 mb-2">${property.address}, ${property.city}</p>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${getTypeLabel(property.type)}</span>
            <span class="text-xs px-2 py-1 rounded text-white" style="background-color: ${STATUS_COLORS[property.status] || '#6b7280'}">${getStatusLabel(property.status)}</span>
          </div>
          <p class="font-semibold text-sm">${formatCurrency(property.value)}</p>
          <button 
            class="w-full mt-2 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700"
            onclick="window.selectProperty?.('${property.id}')"
          >
            Ver Detalhes
          </button>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([property.longitude, property.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit map to show all properties
    if (propertiesWithCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      propertiesWithCoords.forEach(property => {
        if (property.latitude !== null && property.longitude !== null) {
          bounds.extend([property.longitude, property.latitude]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }

    // Global function for popup buttons
    (window as any).selectProperty = onSelect;

    return () => {
      delete (window as any).selectProperty;
    };
  }, [propertiesWithCoords, onSelect, isConfigured]);

  if (!isConfigured) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro de Configuração</h3>
        <p className="text-muted-foreground text-center max-w-md">
          O token do Mapbox não está configurado nas Variáveis de Ambiente do servidor. Contate o administrador do sistema.
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {mapError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {propertiesWithCoords.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum imóvel com coordenadas para exibir</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-2">
        <div className="text-xs text-muted-foreground">
          {propertiesWithCoords.length} imóvel(eis) no mapa
        </div>
      </div>
    </div>
  );
}
