
import { useState, useEffect } from 'react';

interface UseMapboxLoaderReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  retryLoad: () => void;
}

// Global state to track Mapbox loading across components
let mapboxLoadState: {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  callbacks: Set<(state: UseMapboxLoaderReturn) => void>;
  loadPromise: Promise<void> | null;
} = {
  isLoaded: false,
  isLoading: false,
  error: null,
  callbacks: new Set(),
  loadPromise: null
};

const notifyCallbacks = () => {
  const state = {
    isLoaded: mapboxLoadState.isLoaded,
    isLoading: mapboxLoadState.isLoading,
    error: mapboxLoadState.error,
    retryLoad: () => loadMapbox(true)
  };
  console.log('useMapboxLoader: Notifying callbacks with state:', state);
  mapboxLoadState.callbacks.forEach(callback => callback(state));
};

const loadMapbox = async (forceReload = false) => {
  // If already loaded and not forcing reload, return
  if (mapboxLoadState.isLoaded && !forceReload) {
    console.log('useMapboxLoader: Mapbox already loaded');
    return;
  }

  // If already loading and not forcing reload, wait for existing promise
  if (mapboxLoadState.isLoading && !forceReload && mapboxLoadState.loadPromise) {
    console.log('useMapboxLoader: Waiting for existing load promise');
    return mapboxLoadState.loadPromise;
  }

  console.log('useMapboxLoader: Starting mapbox script load', { forceReload });
  
  mapboxLoadState.isLoading = true;
  mapboxLoadState.error = null;
  notifyCallbacks();

  mapboxLoadState.loadPromise = new Promise<void>((resolve, reject) => {
    try {
      // Check if already loaded in window
      if (window.mapboxgl && !forceReload) {
        console.log('useMapboxLoader: Mapbox already loaded from window');
        mapboxLoadState.isLoaded = true;
        mapboxLoadState.isLoading = false;
        notifyCallbacks();
        resolve();
        return;
      }

      // Remove existing script if force reloading
      if (forceReload) {
        const existingScript = document.querySelector('script[src*="mapbox-gl.js"]');
        if (existingScript) {
          existingScript.remove();
        }
        const existingLink = document.querySelector('link[href*="mapbox-gl.css"]');
        if (existingLink) {
          existingLink.remove();
        }
        // Clear window reference
        if (window.mapboxgl) {
          delete (window as any).mapboxgl;
        }
      }

      // Check if script already exists (and not force reloading)
      const existingScript = document.querySelector('script[src*="mapbox-gl.js"]');
      if (existingScript && !forceReload) {
        console.log('useMapboxLoader: Mapbox script already exists, waiting for load');
        existingScript.addEventListener('load', () => {
          console.log('useMapboxLoader: Existing script loaded');
          mapboxLoadState.isLoaded = true;
          mapboxLoadState.isLoading = false;
          notifyCallbacks();
          resolve();
        });
        existingScript.addEventListener('error', (error) => {
          console.error('useMapboxLoader: Error with existing script:', error);
          mapboxLoadState.error = 'Erro ao carregar biblioteca do Mapbox';
          mapboxLoadState.isLoading = false;
          notifyCallbacks();
          reject(new Error('Erro ao carregar biblioteca do Mapbox'));
        });
        return;
      }

      console.log('useMapboxLoader: Creating new script element');

      // Load CSS first
      const existingLink = document.querySelector('link[href*="mapbox-gl.css"]');
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        console.log('useMapboxLoader: CSS loaded');
      }

      // Load script
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        console.log('useMapboxLoader: Script loaded successfully');
        // Small delay to ensure mapboxgl is available
        setTimeout(() => {
          if (window.mapboxgl) {
            mapboxLoadState.isLoaded = true;
            mapboxLoadState.isLoading = false;
            notifyCallbacks();
            resolve();
          } else {
            const error = 'Mapbox GL não está disponível após o carregamento';
            console.error('useMapboxLoader:', error);
            mapboxLoadState.error = error;
            mapboxLoadState.isLoading = false;
            notifyCallbacks();
            reject(new Error(error));
          }
        }, 100);
      };
      script.onerror = (error) => {
        console.error('useMapboxLoader: Error loading script:', error);
        mapboxLoadState.error = 'Erro ao carregar biblioteca do Mapbox';
        mapboxLoadState.isLoading = false;
        notifyCallbacks();
        reject(new Error('Erro ao carregar biblioteca do Mapbox'));
      };
      document.head.appendChild(script);

    } catch (error) {
      console.error('useMapboxLoader: Exception during load:', error);
      mapboxLoadState.error = 'Erro inesperado ao carregar Mapbox';
      mapboxLoadState.isLoading = false;
      notifyCallbacks();
      reject(error);
    }
  });

  return mapboxLoadState.loadPromise;
};

export const useMapboxLoader = (): UseMapboxLoaderReturn => {
  const [state, setState] = useState<UseMapboxLoaderReturn>({
    isLoaded: mapboxLoadState.isLoaded,
    isLoading: mapboxLoadState.isLoading,
    error: mapboxLoadState.error,
    retryLoad: () => loadMapbox(true)
  });

  useEffect(() => {
    console.log('useMapboxLoader: Component mounted, registering callback');
    
    // Add callback to global state
    mapboxLoadState.callbacks.add(setState);

    // Start loading if not already started and not loaded
    if (!mapboxLoadState.isLoaded && !mapboxLoadState.isLoading) {
      loadMapbox();
    }

    // Cleanup
    return () => {
      console.log('useMapboxLoader: Component unmounted, removing callback');
      mapboxLoadState.callbacks.delete(setState);
    };
  }, []);

  return state;
};
