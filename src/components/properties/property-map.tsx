
import { useState, useEffect, useRef } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { geocodeAddress } from '@/api/properties';

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
  const fullAddress = `${address}, ${city}, ${state}`;

  useEffect(() => {
    // Load the Mapbox script dynamically
    const loadMapboxScript = () => {
      if (window.mapboxgl) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };

    loadMapboxScript();
  }, []);

  // Get coordinates for the address
  useEffect(() => {
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
  }, [fullAddress]);

  // Initialize map when both script is loaded and coordinates are available
  useEffect(() => {
    if (!mapLoaded || !coordinates || !mapContainer.current || !window.mapboxgl) return;

    // Temporary public token for development - this should be replaced with proper configuration
    // For production, we should use environment variables or Supabase Edge Functions
    window.mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1haS1hcHAiLCJhIjoiY2x2NXZ1azJhMDV3bDJwcndsMzd2bjVrayJ9.U3QysNCuCeF_l8r8UM-EOw';

    try {
      // Initialize the map
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

      // Clean up on unmount
      return () => {
        if (mapRef.current) mapRef.current.remove();
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Erro ao inicializar o mapa.');
    }
  }, [mapLoaded, coordinates]);

  // Show error or loading state if needed
  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted rounded-lg ${className}`}>
        <div className="text-center p-4">
          <MapIcon className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{error}</p>
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
