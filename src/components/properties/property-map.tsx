
import { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, AlertCircle } from 'lucide-react';
import { geocodeAddress } from '@/api/properties';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { MapboxTokenDialog } from './mapbox-token-dialog';

interface PropertyMapProps {
  address: string;
  city: string;
  state: string;
  className?: string;
}

export function PropertyMap({ address, city, state, className = '' }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  
  const { token, isLoading: isTokenLoading } = useMapbox();
  const fullAddress = `${address}, ${city}, ${state}`;

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

  // Get coordinates for the address
  useEffect(() => {
    if (!token) return;
    
    const getCoordinates = async () => {
      try {
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          setCoordinates(coords);
          setError(null);
        } else {
          setError('Não foi possível encontrar coordenadas para este endereço.');
        }
      } catch (err) {
        console.error('Error getting coordinates:', err);
        setError('Erro ao carregar o mapa.');
      }
    };

    getCoordinates();
  }, [fullAddress, token]);

  // Initialize map when both script is loaded and coordinates are available
  useEffect(() => {
    if (!mapLoaded || !coordinates || !token || !mapContainer.current || !window.mapboxgl) return;

    try {
      // Initialize the map
      window.mapboxgl.accessToken = token;
      
      mapRef.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [coordinates.lng, coordinates.lat],
        zoom: 15
      });

      // Add navigation control (zoom buttons)
      mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      // Add a marker at the property location
      markerRef.current = new window.mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(mapRef.current);

      // Add popup with address info
      new window.mapboxgl.Popup({ offset: 25 })
        .setLngLat([coordinates.lng, coordinates.lat])
        .setHTML(`<p class="font-medium">${fullAddress}</p>`)
        .addTo(mapRef.current);

      // Clean up on unmount
      return () => {
        if (mapRef.current) mapRef.current.remove();
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Erro ao inicializar o mapa. Verifique se o token é válido.');
    }
  }, [mapLoaded, coordinates, token, fullAddress]);

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
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg ${className}`}>
        <div className="text-center p-4 max-w-md">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
          <h3 className="font-medium mb-2">Token do Mapbox não configurado</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Para exibir o mapa da localização do imóvel, é necessário configurar um token de acesso do Mapbox.
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
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => setTokenDialogOpen(true)}
          >
            Alterar Token Mapbox
          </Button>
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
    </div>
  );
}
