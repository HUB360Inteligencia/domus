
import { useState, useRef, useEffect, useCallback } from 'react';
import { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Layers, 
  Building, 
  Navigation,
  Maximize2,
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertyDetailMapProps {
  property: Property;
  className?: string;
}

export function PropertyDetailMap({ property, className }: PropertyDetailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showNearbyPOIs, setShowNearbyPOIs] = useState(true);

  const { getTokenForContext, getStyleForContext, isReady } = useMapbox();
  const { isLoaded: mapboxLoaded, error: mapboxError } = useMapboxLoader();

  const token = isReady ? getTokenForContext('mapbox_token_property_detail') : null;
  const baseStyle = getStyleForContext('mapbox_style_property_detail');

  const currentStyle = showSatellite 
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : baseStyle;

  // Initialize map
  useEffect(() => {
    if (!mapboxLoaded || !token || !mapContainer.current || !window.mapboxgl || mapRef.current || !isReady) {
      return;
    }

    if (!property.latitude || !property.longitude) {
      return;
    }

    try {
      window.mapboxgl.accessToken = token;
      
      mapRef.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: currentStyle,
        center: [property.longitude, property.latitude],
        zoom: 16,
        pitch: is3DEnabled ? 45 : 0,
        bearing: 0
      });

      mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
      mapRef.current.addControl(new window.mapboxgl.FullscreenControl(), 'top-right');

      mapRef.current.on('load', () => {
        setupPropertyMarker();
        if (showNearbyPOIs) {
          setupNearbyPOIs();
        }
        setIsMapInitialized(true);
      });

    } catch (err) {
      console.error('Error initializing property detail map:', err);
    }
  }, [mapboxLoaded, token, isReady, property.latitude, property.longitude]);

  // Update map style
  useEffect(() => {
    if (mapRef.current && isMapInitialized) {
      mapRef.current.setStyle(currentStyle);
      mapRef.current.once('styledata', () => {
        setupPropertyMarker();
        if (showNearbyPOIs) {
          setupNearbyPOIs();
        }
      });
    }
  }, [currentStyle, isMapInitialized]);

  // Update 3D view
  useEffect(() => {
    if (mapRef.current && isMapInitialized) {
      mapRef.current.easeTo({
        pitch: is3DEnabled ? 45 : 0,
        duration: 1000
      });
    }
  }, [is3DEnabled, isMapInitialized]);

  const setupPropertyMarker = useCallback(() => {
    if (!mapRef.current || !property.latitude || !property.longitude) return;

    // Create custom marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'property-marker';
    markerElement.innerHTML = `
      <div style="
        background: #3b82f6;
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          color: white;
          font-size: 16px;
          font-weight: bold;
          transform: rotate(45deg);
        ">🏠</div>
      </div>
    `;

    new window.mapboxgl.Marker(markerElement)
      .setLngLat([property.longitude, property.latitude])
      .setPopup(
        new window.mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-sm mb-1">${property.title}</h3>
              <p class="text-xs text-gray-600 mb-2">${property.address}${property.property_number ? `, ${property.property_number}` : ''}</p>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span>Valor:</span>
                  <span class="font-medium">${formatCurrency(property.value)}</span>
                </div>
                ${property.area ? `
                <div class="flex justify-between">
                  <span>Área:</span>
                  <span class="font-medium">${property.area} m²</span>
                </div>
                ` : ''}
                <div class="flex justify-between">
                  <span>Status:</span>
                  <span class="font-medium">${property.status === 'available' ? 'Disponível' : 
                    property.status === 'rented' ? 'Alugado' : 
                    property.status === 'sold' ? 'Vendido' : property.status}</span>
                </div>
              </div>
            </div>
          `)
      )
      .addTo(mapRef.current);
  }, [property]);

  const setupNearbyPOIs = useCallback(() => {
    if (!mapRef.current) return;

    // Add nearby points of interest (schools, hospitals, transport)
    const poiTypes = [
      { category: 'school', icon: '🎓', color: '#10b981' },
      { category: 'hospital', icon: '🏥', color: '#ef4444' },
      { category: 'transit_station', icon: '🚇', color: '#6366f1' },
      { category: 'shopping_mall', icon: '🛍️', color: '#f59e0b' },
      { category: 'restaurant', icon: '🍽️', color: '#8b5cf6' }
    ];

    poiTypes.forEach(poi => {
      if (!mapRef.current.getSource(`poi-${poi.category}`)) {
        mapRef.current.addSource(`poi-${poi.category}`, {
          type: 'vector',
          url: `mapbox://mapbox.mapbox-streets-v8`
        });

        mapRef.current.addLayer({
          id: `poi-${poi.category}`,
          type: 'symbol',
          source: `poi-${poi.category}`,
          'source-layer': 'poi_label',
          filter: ['==', 'class', poi.category],
          layout: {
            'text-field': poi.icon,
            'text-size': 16,
            'text-anchor': 'center'
          }
        });
      }
    });
  }, []);

  const centerOnProperty = () => {
    if (mapRef.current && property.latitude && property.longitude) {
      mapRef.current.flyTo({
        center: [property.longitude, property.latitude],
        zoom: 16,
        duration: 1500
      });
    }
  };

  const resetView = () => {
    if (mapRef.current && property.latitude && property.longitude) {
      mapRef.current.flyTo({
        center: [property.longitude, property.latitude],
        zoom: 16,
        pitch: 0,
        bearing: 0,
        duration: 1500
      });
      setIs3DEnabled(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapInitialized(false);
      }
    };
  }, []);

  if (!property.latitude || !property.longitude) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg">
        <div className="text-center p-4">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Coordenadas não disponíveis para esta propriedade</p>
        </div>
      </div>
    );
  }

  if (!isReady || !mapboxLoaded) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-2" />
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (mapboxError || !token) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="text-muted-foreground">Erro ao carregar mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-[500px] rounded-lg shadow-sm" />
      
      {/* Map Controls */}
      <Card className="absolute top-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Controles do Mapa</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Vista 3D:</label>
            <Switch
              checked={is3DEnabled}
              onCheckedChange={setIs3DEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Satélite:</label>
            <Switch
              checked={showSatellite}
              onCheckedChange={setShowSatellite}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Pontos de Interesse:</label>
            <Switch
              checked={showNearbyPOIs}
              onCheckedChange={setShowNearbyPOIs}
            />
          </div>
          
          <div className="flex gap-1 pt-2">
            <Button size="sm" variant="outline" onClick={centerOnProperty} className="flex-1">
              <Navigation className="h-3 w-3 mr-1" />
              Centralizar
            </Button>
            <Button size="sm" variant="outline" onClick={resetView} className="flex-1">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Property Info */}
      <Card className="absolute bottom-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-4 w-4" />
            Informações da Propriedade
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex justify-between text-xs">
            <span>Endereço:</span>
            <Badge variant="outline" className="text-xs">
              {property.neighborhood || property.city}
            </Badge>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Tipo:</span>
            <Badge variant="outline" className="text-xs">
              {property.type === 'apartment' ? 'Apartamento' :
               property.type === 'house' ? 'Casa' :
               property.type === 'commercial' ? 'Comercial' : property.type}
            </Badge>
          </div>
          
          {property.area && (
            <div className="flex justify-between text-xs">
              <span>Área:</span>
              <Badge variant="outline" className="text-xs">
                {property.area} m²
              </Badge>
            </div>
          )}
          
          <div className="flex justify-between text-xs">
            <span>Valor:</span>
            <Badge variant="default" className="text-xs">
              {formatCurrency(property.value)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Map Legend */}
      {showNearbyPOIs && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="text-xs font-medium mb-2">Pontos de Interesse</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>🎓</span>
              <span>Escolas</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏥</span>
              <span>Hospitais</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚇</span>
              <span>Transporte</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🛍️</span>
              <span>Shopping</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🍽️</span>
              <span>Restaurantes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
