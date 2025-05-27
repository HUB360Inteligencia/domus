
import { useState, useEffect } from 'react';

export function useMapboxLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMapbox = async () => {
    if ((window as any).mapboxgl) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if script is already in the document
      const existingScript = document.querySelector('script[src*="mapbox-gl"]');
      if (existingScript) {
        // Wait a bit for the script to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        if ((window as any).mapboxgl) {
          setIsLoaded(true);
          setIsLoading(false);
          return;
        }
      }

      // Dynamically load Mapbox GL JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        setIsLoaded(true);
        setIsLoading(false);
      };
      script.onerror = () => {
        setError('Erro ao carregar Mapbox GL JS');
        setIsLoading(false);
      };
      document.head.appendChild(script);

      // Also load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(link);

    } catch (err) {
      setError('Erro ao inicializar Mapbox');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMapbox();
  }, []);

  const retryLoad = () => {
    loadMapbox();
  };

  return { isLoaded, isLoading, error, retryLoad };
}
