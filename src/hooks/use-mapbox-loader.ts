
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
  mapboxLoadState.callbacks.forEach(callback => callback(state));
};

export const useMapboxLoader = (): UseMapboxLoaderReturn => {
  const [state, setState] = useState<UseMapboxLoaderReturn>({
    isLoaded: mapboxLoadState.isLoaded,
    isLoading: mapboxLoadState.isLoading,
    error: mapboxLoadState.error
  });

  useEffect(() => {
    // Add callback to global state
    mapboxLoadState.callbacks.add(setState);

    // Start loading if not already started and not loaded
    if (!mapboxLoadState.isLoaded && !mapboxLoadState.isLoading) {
      loadMapbox();
    }

    // Cleanup
    return () => {
      mapboxLoadState.callbacks.delete(setState);
    };
  }, []);

  return state;
};

const loadMapbox = () => {
  // Check if already loaded
  if (window.mapboxgl) {
    mapboxLoadState.isLoaded = true;
    notifyCallbacks();
    return;
  }

  mapboxLoadState.isLoading = true;
  mapboxLoadState.error = null;
  notifyCallbacks();

  // Load script
  const script = document.createElement('script');
  script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
  script.onload = () => {
    mapboxLoadState.isLoaded = true;
    mapboxLoadState.isLoading = false;
    notifyCallbacks();
  };
  script.onerror = () => {
    mapboxLoadState.error = 'Erro ao carregar biblioteca do Mapbox';
    mapboxLoadState.isLoading = false;
    notifyCallbacks();
  };
  document.head.appendChild(script);

  // Load CSS
  const link = document.createElement('link');
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};
