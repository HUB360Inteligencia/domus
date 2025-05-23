
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
  console.log('Mapbox state change:', state);
  mapboxLoadState.callbacks.forEach(callback => callback(state));
};

export const useMapboxLoader = (): UseMapboxLoaderReturn => {
  const [state, setState] = useState<UseMapboxLoaderReturn>({
    isLoaded: mapboxLoadState.isLoaded,
    isLoading: mapboxLoadState.isLoading,
    error: mapboxLoadState.error
  });

  useEffect(() => {
    console.log('useMapboxLoader: registering callback');
    
    // Add callback to global state
    mapboxLoadState.callbacks.add(setState);

    // Start loading if not already started and not loaded
    if (!mapboxLoadState.isLoaded && !mapboxLoadState.isLoading) {
      console.log('useMapboxLoader: starting mapbox load');
      loadMapbox();
    }

    // Cleanup
    return () => {
      console.log('useMapboxLoader: removing callback');
      mapboxLoadState.callbacks.delete(setState);
    };
  }, []);

  return state;
};

const loadMapbox = () => {
  // Check if already loaded
  if (window.mapboxgl) {
    console.log('Mapbox already loaded from window');
    mapboxLoadState.isLoaded = true;
    notifyCallbacks();
    return;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="mapbox-gl.js"]');
  if (existingScript) {
    console.log('Mapbox script already exists, waiting for load');
    existingScript.addEventListener('load', () => {
      mapboxLoadState.isLoaded = true;
      mapboxLoadState.isLoading = false;
      notifyCallbacks();
    });
    return;
  }

  console.log('Loading Mapbox script...');
  mapboxLoadState.isLoading = true;
  mapboxLoadState.error = null;
  notifyCallbacks();

  // Load script
  const script = document.createElement('script');
  script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
  script.onload = () => {
    console.log('Mapbox script loaded successfully');
    mapboxLoadState.isLoaded = true;
    mapboxLoadState.isLoading = false;
    notifyCallbacks();
  };
  script.onerror = (error) => {
    console.error('Error loading Mapbox script:', error);
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
    console.log('Mapbox CSS loaded');
  }
};
