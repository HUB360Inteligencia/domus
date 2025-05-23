
import { useState, useEffect, useRef, useMemo } from 'react';
import { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { MapboxTokenDialog } from './mapbox-token-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapIcon, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertyMapViewProps {
  properties: Property[];
  onSelect: (id: string) => void;
}

export function PropertyMapView({ properties, onSelect }: PropertyMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  
  const { getTokenForContext, getStyleForContext, isTokenLoading } = useMapbox();
  const { isLoaded: mapboxLoaded, isLoading: mapboxLoading, error: mapboxError } = useMapboxLoader();

  // Get specific token and style for property list context
  const token = getTokenForContext('mapbox_token_property_list');
  const mapStyle = getStyleForContext('mapbox_style_property_list');

  console.log('PropertyMapView render:', { 
    token: !!token, 
    mapboxLoaded, 
    mapboxLoading, 
    mapboxError,
    propertiesCount: properties.length 
  });

  // Memoize properties to prevent unnecessary re-renders
  const memoizedProperties = useMemo(() => {
    console.log('Memoizing properties:', properties.length);
    return properties.filter(p => p.latitude && p.longitude);
  }, [properties.length]);

  // Property type icons mapping
  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'apartment': return '🏢';
      case 'house': return '🏠';
      case 'commercial': return '🏪';
      case 'land': return '🏞️';
      case 'rural': return '🏡';
      default: return '📍';
    }
  };

  // Property status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'rented': return '#3b82f6';
      case 'airbnb': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      case 'sold': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapboxLoaded || !token || !mapContainer.current || !window.mapboxgl) {
      console.log('Map initialization skipped:', { mapboxLoaded, token: !!token, container: !!mapContainer.current, mapboxgl: !!window.mapboxgl });
      return;
    }

    if (mapRef.current) {
      console.log('Map already initialized');
      return;
    }

    try {
      console.log('Initializing map with token and style:', { token: token.substring(0, 20) + '...', mapStyle });
      
      window.mapboxgl.accessToken = token;
      
      // Calculate bounds for all properties with coordinates
      const propertiesWithCoords = memoizedProperties;
      
      let center = [-46.633308, -23.550520]; // Default to São Paulo
      let zoom = 10;
      
      if (propertiesWithCoords.length > 0) {
        // If only one property, center on it
        if (propertiesWithCoords.length === 1) {
          center = [propertiesWithCoords[0].longitude!, propertiesWithCoords[0].latitude!];
          zoom = 15;
        }
      }

      mapRef.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center,
        zoom,
        attributionControl: true
      });

      // Add navigation controls
      mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      // Fit to bounds if multiple properties
      if (propertiesWithCoords.length > 1) {
        const bounds = new window.mapboxgl.LngLatBounds();
        propertiesWithCoords.forEach(property => {
          bounds.extend([property.longitude!, property.latitude!]);
        });
        
        mapRef.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15
        });
      }

      console.log('Map initialized successfully');
      setError(null);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Erro ao inicializar o mapa. Verifique se o token é válido.');
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up map');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapboxLoaded, token, mapStyle, memoizedProperties]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded) return;

    console.log('Updating markers for', memoizedProperties.length, 'properties');

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker.cleanupListeners) marker.cleanupListeners();
      marker.remove();
    });
    markersRef.current = [];

    // Add markers for properties with coordinates
    memoizedProperties.forEach(property => {
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${getStatusColor(property.status)};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      markerElement.innerHTML = getPropertyIcon(property.type);
      
      // Hover effect
      const mouseEnterListener = () => {
        markerElement.style.transform = 'scale(1.2)';
        markerElement.style.zIndex = '1000';
      };
      
      const mouseLeaveListener = () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = 'auto';
      };
      
      markerElement.addEventListener('mouseenter', mouseEnterListener);
      markerElement.addEventListener('mouseleave', mouseLeaveListener);

      // Create marker
      const marker = new window.mapboxgl.Marker(markerElement)
        .setLngLat([property.longitude!, property.latitude!])
        .addTo(mapRef.current);

      // Create popup content
      const popupContent = `
        <div class="p-3 max-w-xs">
          ${property.image_url ? `
            <img src="${property.image_url}" alt="${property.title}" 
                 class="w-full h-24 object-cover rounded mb-2" />
          ` : `
            <div class="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center">
              <span class="text-gray-500 text-2xl">${getPropertyIcon(property.type)}</span>
            </div>
          `}
          <h3 class="font-semibold text-sm mb-1">${property.title}</h3>
          <p class="text-xs text-gray-600 mb-2">${property.address}, ${property.city}</p>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs px-2 py-1 rounded text-white" 
                  style="background-color: ${getStatusColor(property.status)}">
              ${getStatusLabel(property.status)}
            </span>
            <span class="font-bold text-sm">${formatCurrency(property.value)}</span>
          </div>
          <button 
            class="w-full bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600 transition-colors"
            onclick="window.selectProperty('${property.id}')"
          >
            Ver Detalhes
          </button>
        </div>
      `;

      // Create popup
      const popup = new window.mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      // Add popup to marker
      marker.setPopup(popup);

      markersRef.current.push(marker);
      
      // Store cleanup functions for the marker
      marker.cleanupListeners = () => {
        markerElement.removeEventListener('mouseenter', mouseEnterListener);
        markerElement.removeEventListener('mouseleave', mouseLeaveListener);
      };
    });

    // Make selectProperty available globally for popup buttons
    (window as any).selectProperty = onSelect;

    // Clean up event listeners
    return () => {
      markersRef.current.forEach(marker => {
        if (marker.cleanupListeners) marker.cleanupListeners();
        marker.remove();
      });
      markersRef.current = [];
    };
  }, [mapboxLoaded, mapRef.current, memoizedProperties, onSelect]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'rented': return 'Alugado';
      case 'airbnb': return 'Airbnb';
      case 'maintenance': return 'Manutenção';
      case 'sold': return 'Vendido';
      default: return status;
    }
  };

  if (isTokenLoading || mapboxLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-2" />
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (mapboxError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="text-muted-foreground mb-4">{mapboxError}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4 max-w-md">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
          <h3 className="font-medium mb-2">Token do Mapbox não configurado</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Para exibir o mapa das propriedades, configure o token "Listagem de Imóveis" nas configurações do sistema.
          </p>
          <Button onClick={() => setTokenDialogOpen(true)} variant="outline">
            Configurar Token Temporário
          </Button>
          <MapboxTokenDialog 
            isOpen={tokenDialogOpen} 
            onClose={() => setTokenDialogOpen(false)} 
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTokenDialogOpen(true)}
            >
              Alterar Token
            </Button>
          </div>
          <MapboxTokenDialog 
            isOpen={tokenDialogOpen} 
            onClose={() => setTokenDialogOpen(false)} 
          />
        </div>
      </div>
    );
  }

  const propertiesWithCoords = memoizedProperties;
  const propertiesWithoutCoords = properties.length - propertiesWithCoords.length;

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-sm" />
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="text-sm">
          <div className="font-medium">{propertiesWithCoords.length} propriedades no mapa</div>
          {propertiesWithoutCoords > 0 && (
            <div className="text-muted-foreground text-xs">
              {propertiesWithoutCoords} sem localização
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="text-xs font-medium mb-2">Status dos Imóveis</div>
        <div className="space-y-1">
          {[
            { status: 'available', label: 'Disponível', color: '#10b981' },
            { status: 'rented', label: 'Alugado', color: '#3b82f6' },
            { status: 'airbnb', label: 'Airbnb', color: '#ef4444' },
            { status: 'maintenance', label: 'Manutenção', color: '#f59e0b' },
            { status: 'sold', label: 'Vendido', color: '#8b5cf6' }
          ].map(({ status, label, color }) => (
            <div key={status} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
