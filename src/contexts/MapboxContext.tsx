
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSystemSettings, MapboxTokenType } from '@/hooks/use-system-settings';

interface MapboxContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  error: string | null;
  getTokenForContext: (tokenType: MapboxTokenType) => string | null;
  isTokenLoading: boolean;
}

const defaultMapboxContext: MapboxContextType = {
  token: null,
  isLoading: true,
  setToken: () => {},
  error: null,
  getTokenForContext: () => null,
  isTokenLoading: true,
};

const LOCAL_STORAGE_KEY = 'mapbox_token';

export const MapboxContext = createContext<MapboxContextType>(defaultMapboxContext);

export const useMapbox = () => useContext(MapboxContext);

interface MapboxProviderProps {
  children: ReactNode;
}

export const MapboxProvider = ({ children }: MapboxProviderProps) => {
  const [legacyToken, setLegacyTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getMapboxToken, isLoading: isSettingsLoading, error: settingsError } = useSystemSettings();

  // Load legacy token from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedToken) {
        setLegacyTokenState(savedToken);
      }
    } catch (e) {
      console.error('Error loading legacy Mapbox token:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set error from settings
  useEffect(() => {
    if (settingsError) {
      setError(settingsError);
    }
  }, [settingsError]);

  const setToken = (newToken: string) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newToken);
      setLegacyTokenState(newToken);
      setError(null);
    } catch (e) {
      console.error('Error saving legacy Mapbox token:', e);
      setError('Failed to save token');
    }
  };

  const getTokenForContext = (tokenType: MapboxTokenType): string | null => {
    // First try to get the token from system settings
    const systemToken = getMapboxToken(tokenType);
    if (systemToken) {
      return systemToken;
    }

    // Fallback to legacy token for backward compatibility
    if (legacyToken) {
      return legacyToken;
    }

    return null;
  };

  // For backward compatibility, return property_list token as default
  const defaultToken = getTokenForContext('mapbox_token_property_list') || legacyToken;

  return (
    <MapboxContext.Provider value={{ 
      token: defaultToken, 
      isLoading: isLoading || isSettingsLoading, 
      setToken, 
      error,
      getTokenForContext,
      isTokenLoading: isSettingsLoading
    }}>
      {children}
    </MapboxContext.Provider>
  );
};
