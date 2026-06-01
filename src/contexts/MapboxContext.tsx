
import React, { createContext, useContext, useState, useEffect } from 'react';

interface MapboxContextType {
  token: string | null;
  setToken: (token: string) => void;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
  getTokenForContext: (context: string) => string | null;
  getStyleForContext: (context: string) => string;
  retryInitialization: () => void;
}

const MapboxContext = createContext<MapboxContextType | undefined>(undefined);

const DEFAULT_MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

export function MapboxProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeMapbox();
  }, []);

  const initializeMapbox = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load token from environment variables
      const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
      if (envToken) {
        setTokenState(envToken);
      } else {
        setError('Token do Mapbox não configurado no servidor.');
      }
    } catch (err) {
      console.error('Error loading Mapbox token:', err);
      setError('Erro ao carregar token do Mapbox');
    } finally {
      setIsLoading(false);
    }
  };

  const setToken = (newToken: string) => {
    console.warn('Mapbox tokens are now managed via environment variables. This function is deprecated.');
  };

  const getTokenForContext = (context: string) => {
    // For now, return the same token for all contexts
    // In the future, you could have different tokens for different contexts
    return token;
  };

  const getStyleForContext = (context: string) => {
    // Return appropriate style based on context
    const styles: Record<string, string> = {
      'mapbox_style_property_list': 'mapbox://styles/mapbox/streets-v12',
      'mapbox_style_property_detail': 'mapbox://styles/mapbox/satellite-v9',
      'mapbox_style_property_3d': 'mapbox://styles/mapbox/satellite-streets-v12',
      'mapbox_style_analytics': 'mapbox://styles/mapbox/light-v11',
    };
    
    return styles[context] || DEFAULT_MAPBOX_STYLE;
  };

  const retryInitialization = () => {
    initializeMapbox();
  };

  const isConfigured = !!token;
  const isReady = !isLoading && !!token && !error;

  return (
    <MapboxContext.Provider value={{ 
      token, 
      setToken, 
      isConfigured, 
      isLoading,
      error,
      isReady,
      getTokenForContext,
      getStyleForContext,
      retryInitialization
    }}>
      {children}
    </MapboxContext.Provider>
  );
}

export function useMapbox() {
  const context = useContext(MapboxContext);
  if (context === undefined) {
    throw new Error('useMapbox must be used within a MapboxProvider');
  }
  return context;
}
