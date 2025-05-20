
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MapboxContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  error: string | null;
}

const defaultMapboxContext: MapboxContextType = {
  token: null,
  isLoading: true,
  setToken: () => {},
  error: null,
};

const LOCAL_STORAGE_KEY = 'mapbox_token';

export const MapboxContext = createContext<MapboxContextType>(defaultMapboxContext);

export const useMapbox = () => useContext(MapboxContext);

interface MapboxProviderProps {
  children: ReactNode;
}

export const MapboxProvider = ({ children }: MapboxProviderProps) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedToken) {
        setTokenState(savedToken);
      }
    } catch (e) {
      console.error('Error loading Mapbox token:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setToken = (newToken: string) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newToken);
      setTokenState(newToken);
      setError(null);
    } catch (e) {
      console.error('Error saving Mapbox token:', e);
      setError('Failed to save token');
    }
  };

  return (
    <MapboxContext.Provider value={{ token, isLoading, setToken, error }}>
      {children}
    </MapboxContext.Provider>
  );
};
