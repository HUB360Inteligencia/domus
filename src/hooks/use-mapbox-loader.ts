
import { useState, useEffect } from 'react';

interface UseMapboxLoaderReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Global state to track Mapbox loading across components
let mapboxLoadState: {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  callbacks: Set<(state: UseMapboxLoaderReturn) => void>;
} = {
  isLoaded: false,
  isLoading: false,
  error: null,
  callbacks: new Set()
};

const notifyCallbacks = () => {
  const state = {
    isLoaded: mapboxLoadState.isLoaded,
    isLoading: mapboxLoadState.isLoading,
    error: mapboxLoadState.error
  };
  console.log('useMapboxLoader: Notifying callbacks with state:', state);
  mapboxLoadState.callbacks.forEach(callback => callback(state));
};

export const useMapboxLoader = (): UseMapboxLoaderReturn => {
  const [state, setState] = useState<UseMapboxLoaderReturn>({
    isLoaded: mapboxLoadState.isLoaded,
    isLoading: mapboxLoadState.isLoading,
    error: mapboxLoadState.error
  });

  useEffect(() => {
    console.log('useMapboxLoader: Component mounted, registering callback');
    
    // Add callback to global state
    mapboxLoadState.callbacks.add(setState);

    // Start loading if not already started and not loaded
    if (!mapboxLoadState.isLoaded && !mapboxLoadState.isLoading) {
      console.log('useMapboxLoader: Starting mapbox script load');
      loadMapbox();
    } else {
      console.log('useMapboxLoader: Mapbox already loaded or loading:', {
        isLoaded: mapboxLoadState.isLoaded,
        isLoading: mapboxLoadState.isLoading
      });
    }

    // Cleanup
    return () => {
      console.log('useMapboxLoader: Component unmounted, removing callback');
      mapboxLoadState.callbacks.delete(setState);
    };
  }, []);

  return state;
};

const loadMapbox = () => {
  console.log('useMapboxLoader: Loading Mapbox script...');
  
  // Check if already loaded
  if (window.mapboxgl) {
    console.log('useMapboxLoader: Mapbox already loaded from window');
    mapboxLoadState.isLoaded = true;
    mapboxLoadState.isLoading = false;
    notifyCallbacks();
    return;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="mapbox-gl.js"]');
  if (existingScript) {
    console.log('useMapboxLoader: Mapbox script already exists, waiting for load');
    existingScript.addEventListener('load', () => {
      console.log('useMapboxLoader: Existing script loaded');
      mapboxLoadState.isLoaded = true;
      mapboxLoadState.isLoading = false;
      notifyCallbacks();
    });
    existingScript.addEventListener('error', (error) => {
      console.error('useMapboxLoader: Error with existing script:', error);
      mapboxLoadState.error = 'Erro ao carregar biblioteca do Mapbox';
      mapboxLoadState.isLoading = false;
      notifyCallbacks();
    });
    return;
  }

  console.log('useMapboxLoader: Creating new script element');
  mapboxLoadState.isLoading = true;
  mapboxLoadState.error = null;
  notifyCallbacks();

  // Load script
  const script = document.createElement('script');
  script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
  script.onload = () => {
    console.log('useMapboxLoader: Script loaded successfully');
    mapboxLoadState.isLoaded = true;
    mapboxLoadState.isLoading = false;
    notifyCallbacks();
  };
  script.onerror = (error) => {
    console.error('useMapboxLoader: Error loading script:', error);
    mapboxLoadState.error = 'Erro ao carregar biblioteca do Mapbox';
    mapboxLoadState.isLoading = false;
    notifyCallbacks();
  };
  document.head.appendChild(script);

  // Load CSS
  const existingLink = document.querySelector('link[href*="mapbox-gl.css"]');
  if (!existingLink) {
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    console.log('useMapboxLoader: CSS loaded');
  }
};
