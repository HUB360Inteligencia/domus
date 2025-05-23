import { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, AlertCircle, Locate, MapPin } from 'lucide-react';
import { geocodeAddress, updatePropertyCoordinates } from '@/api/properties';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { MapboxTokenDialog } from './mapbox-token-dialog';
import { toast } from 'sonner';

interface PropertyMapProps {
  address: string;
  city: string;
  state: string;
  propertyId?: string;
  property_number?: string; // Changed from propertyNumber to property_number to match DB schema
  complement?: string;
  neighborhood?: string;
  initialCoords?: { lat: number; lng: number } | null;
  editable?: boolean;
  onCoordsChange?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  mapType?: 'detail' | '3d'; // New prop to choose map type
}

export function PropertyMap({ 
  address, 
  city, 
  state, 
  propertyId,
  property_number,
  complement,
  initialCoords,
  editable = false,
  onCoordsChange,
  className = '',
  mapType = 'detail' // Default to detail view
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(initialCoords || null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { getTokenForContext, isTokenLoading } = useMapbox();
  
  // Get appropriate token based on map type
  const tokenType = mapType === '3d' ? 'mapbox_token_property_3d' : 'mapbox_token_property_detail';
  const token = getTokenForContext(tokenType);
  
  // Create a full address string that includes property number and complement
  const fullAddress = `${address}${property_number ? `, ${property_number}` : ''}${complement ? `, ${complement}` : ''}, ${city}, ${state}`;

  // Load Mapbox script dynamically
  useEffect(() => {
    if (!token) return;
    
    const loadMapboxScript = () => {
      if (window.mapboxgl) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setError('Erro ao carregar biblioteca do Mapbox');
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };

    loadMapboxScript();
  }, [token]);

  // Get coordinates for the address if they aren't provided
  useEffect(() => {
    if (!token || initialCoords) return;
    
    const getCoordinates = async () => {
      setIsLocating(true);
      try {
        const coords = await geocodeAddress(address, property_number, city, state);
        if (coords) {
          setCoordinates(coords);
          setError(null);
          if (onCoordsChange) {
            onCoordsChange(coords);
          }
        } else {
          setError('Não foi possível encontrar coordenadas para este endereço.');
        }
      } catch (err: any) {
        console.error('Error getting coordinates:', err);
        setError('Erro ao carregar o mapa.');
      } finally {
        setIsLocating(false);
      }
    };

    getCoordinates();
  }, [fullAddress, token, initialCoords, onCoordsChange, address, city, state, property_number]);

  // Initialize map when both script is loaded and coordinates are available
  useEffect(() => {
    if (!mapLoaded || !coordinates || !token || !mapContainer.current || !window.mapboxgl) return;

    try {
      // Initialize the map
      window.mapboxgl.accessToken = token;
      
      const mapStyle = mapType === '3d' 
        ? 'mapbox://styles/mapbox/streets-v12' 
        : 'mapbox://styles/mapbox/satellite-streets-v12';
      
      const initialPitch = mapType === '3d' ? 45 : 0;
      
      mapRef.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [coordinates.lng, coordinates.lat],
        zoom: 15,
        pitch: initialPitch,
        attributionControl: true
      });

      // Add navigation control (zoom buttons)
      mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      // Add a draggable marker at the property location
      markerRef.current = new window.mapboxgl.Marker({
        color: '#3B82F6',
        draggable: editable
      })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(mapRef.current);

      // Add popup with address info
      new window.mapboxgl.Popup({ offset: 25 })
        .setLngLat([coordinates.lng, coordinates.lat])
        .setHTML(`<p class="font-medium">${fullAddress}</p>`)
        .addTo(mapRef.current);

      // Add drag events if the marker is draggable
      if (editable && markerRef.current) {
        markerRef.current.on('dragstart', () => {
          setIsDragging(true);
        });

        markerRef.current.on('dragend', () => {
          const lngLat = markerRef.current.getLngLat();
          const newCoords = { lat: lngLat.lat, lng: lngLat.lng };
          setCoordinates(newCoords);
          setIsDragging(false);
          
          if (onCoordsChange) {
            onCoordsChange(newCoords);
          }
          
          // If we have a propertyId, update the database with new coordinates
          if (propertyId) {
            updatePropertyCoordinates({
              id: propertyId,
              latitude: newCoords.lat,
              longitude: newCoords.lng
            })
            .then(() => {
              toast.success('Localização atualizada com sucesso');
            })
            .catch((err) => {
              toast.error('Erro ao atualizar localização');
              console.error('Error updating coordinates:', err);
            });
          }
        });
      }

      // Clean up on unmount
      return () => {
        if (mapRef.current) mapRef.current.remove();
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Erro ao inicializar o mapa. Verifique se o token é válido.');
    }
  }, [mapLoaded, coordinates, token, fullAddress, editable, propertyId, onCoordsChange, mapType]);

  const handleRefreshLocation = async () => {
    if (!token) return;
    
    setIsLocating(true);
    try {
      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        setCoordinates(coords);
        setError(null);
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 15,
            essential: true
          });
          markerRef.current.setLngLat([coords.lng, coords.lat]);
        }
        
        if (onCoordsChange) {
          onCoordsChange(coords);
        }
        
        if (propertyId) {
          await updatePropertyCoordinates({
            id: propertyId,
            latitude: coords.lat,
            longitude: coords.lng
          });
          toast.success('Localização atualizada com sucesso');
        }
      } else {
        toast.error('Não foi possível geocodificar este endereço');
      }
    } catch (err) {
      console.error('Error refreshing location:', err);
      toast.error('Erro ao atualizar localização');
    } finally {
      setIsLocating(false);
    }
  };

  if (isTokenLoading) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg ${className}`}>
        <div className="text-center p-4">
          <MapIcon className="mx-auto h-10 w-10 text-muted-foreground animate-pulse mb-2" />
          <p className="text-muted-foreground">Carregando configurações do mapa...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    const mapTypeLabel = mapType === '3d' ? 'Visualização 3D' : 'Detalhes do Imóvel';
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg ${className}`}>
        <div className="text-center p-4 max-w-md">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
          <h3 className="font-medium mb-2">Token do Mapbox não configurado</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Para exibir o mapa "{mapTypeLabel}", configure o token correspondente nas configurações do sistema.
          </p>
          <Button onClick={() => setTokenDialogOpen(true)}>
            Configurar Token Mapbox
          </Button>
          <MapboxTokenDialog 
            isOpen={tokenDialogOpen} 
            onClose={() => setTokenDialogOpen(false)} 
          />
        </div>
      </div>
    );
  }

  // Show error or loading state if needed
  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshLocation}
              disabled={isLocating}
            >
              {isLocating ? 'Buscando...' : 'Tentar novamente'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTokenDialogOpen(true)}
            >
              Alterar Token Mapbox
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

  if (!coordinates || !mapLoaded) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg ${className}`}>
        <div className="text-center p-4">
          <MapIcon className="mx-auto h-10 w-10 text-muted-foreground animate-pulse mb-2" />
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="h-64 rounded-lg shadow-sm" />
      {editable && (
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleRefreshLocation}
            disabled={isLocating}
            className="shadow-md bg-white text-gray-800 border border-gray-200"
          >
            <Locate className={`h-4 w-4 mr-1 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Localizando...' : 'Atualizar localização'}
          </Button>
        </div>
      )}
      {isDragging && editable && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm z-10 shadow-lg">
          <MapPin className="inline-block h-4 w-4 mr-1" /> Arraste para ajustar a localização
        </div>
      )}
    </div>
  );
}
