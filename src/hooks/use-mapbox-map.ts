
import { useRef, useEffect, useState, useCallback } from 'react';
import { useMapboxLoader } from './use-mapbox-loader';

import { logger } from "@/lib/logger";
interface UseMapboxMapOptions {
  token: string | null;
  style: string;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
}

interface UseMapboxMapReturn {
  mapContainer: React.RefObject<HTMLDivElement>;
  map: React.RefObject<any>;
  isReady: boolean;
  error: string | null;
  initializeMap: () => void;
}

export const useMapboxMap = ({ 
  token, 
  style, 
  center = [-46.633308, -23.550520], 
  zoom = 10,
  pitch = 0 
}: UseMapboxMapOptions): UseMapboxMapReturn => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isLoaded: mapboxLoaded, error: mapboxError } = useMapboxLoader();

  const initializeMap = useCallback(() => {
    if (!mapboxLoaded || !token || !mapContainer.current || !window.mapboxgl || map.current) {
      logger.log('Map initialization skipped:', { 
        mapboxLoaded, 
        token: !!token, 
        container: !!mapContainer.current, 
        mapboxgl: !!window.mapboxgl,
        existingMap: !!map.current
      });
      return;
    }

    try {
      logger.log('Initializing map with:', { token: token.substring(0, 20) + '...', style, center, zoom, pitch });
      
      window.mapboxgl.accessToken = token;
      
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style,
        center,
        zoom,
        pitch,
        attributionControl: true
      });

      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        logger.log('Map loaded successfully');
        setIsReady(true);
        setError(null);
      });

      map.current.on('error', (e: any) => {
        logger.error('Map error:', e);
        setError('Erro no mapa: ' + (e.error?.message || 'Erro desconhecido'));
      });

    } catch (err) {
      logger.error('Error initializing map:', err);
      setError('Erro ao inicializar o mapa. Verifique se o token é válido.');
    }
  }, [mapboxLoaded, token, style, center, zoom, pitch]);

  useEffect(() => {
    if (mapboxError) {
      setError(mapboxError);
      return;
    }

    initializeMap();

    // Cleanup on unmount
    return () => {
      if (map.current) {
        logger.log('Cleaning up map');
        map.current.remove();
        map.current = null;
        setIsReady(false);
      }
    };
  }, [mapboxError, initializeMap]);

  return {
    mapContainer,
    map,
    isReady,
    error,
    initializeMap
  };
};
