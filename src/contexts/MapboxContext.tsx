
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSystemSettings, MapboxTokenType, MapboxStyleType } from '@/hooks/use-system-settings';

interface MapboxContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  error: string | null;
  getTokenForContext: (tokenType: MapboxTokenType) => string | null;
  getStyleForContext: (styleType: MapboxStyleType) => string | null;
  isReady: boolean;
  retryInitialization: () => void;
}

const defaultMapboxContext: MapboxContextType = {
  token: null,
  isLoading: true,
  setToken: () => {},
  error: null,
  getTokenForContext: () => null,
  getStyleForContext: () => null,
  isReady: false,
  retryInitialization: () => {},
};

const LOCAL_STORAGE_KEY = 'mapbox_token';

export const MapboxContext = createContext<MapboxContextType>(defaultMapboxContext);

export const useMapbox = () => useContext(MapboxContext);

interface MapboxProviderProps {
  children: ReactNode;
}

export const MapboxProvider: React.FC<MapboxProviderProps> = ({ children }) => {
  const [legacyToken, setLegacyTokenState] = useState<string | null>(null);
  const [isLegacyLoading, setIsLegacyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  
  const { 
    getMapboxToken, 
    getMapboxStyle, 
    isLoading: isSettingsLoading, 
    error: settingsError,
    isInitialized: isSettingsInitialized 
  } = useSystemSettings();

  console.log('MapboxProvider: State:', { 
    isSettingsLoading, 
    isSettingsInitialized,
    settingsError, 
    legacyToken: !!legacyToken,
    isLegacyLoading,
    retryKey
  });

  // Load legacy token from localStorage
  useEffect(() => {
    console.log('MapboxProvider: Loading legacy token');
    try {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEY);
      setLegacyTokenState(savedToken);
    } catch (e) {
      console.error('MapboxProvider: Error loading legacy token:', e);
    } finally {
      setIsLegacyLoading(false);
    }
  }, [retryKey]);

  // Set error from settings
  useEffect(() => {
    if (settingsError) {
      console.error('MapboxProvider: Settings error:', settingsError);
      setError(settingsError);
    } else {
      setError(null);
    }
  }, [settingsError]);

  const setToken = (newToken: string) => {
    console.log('MapboxProvider: Setting new legacy token');
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newToken);
      setLegacyTokenState(newToken);
      setError(null);
    } catch (e) {
      console.error('MapboxProvider: Error saving legacy token:', e);
      setError('Failed to save token');
    }
  };

  const retryInitialization = () => {
    console.log('MapboxProvider: Retrying initialization');
    setError(null);
    setRetryKey(prev => prev + 1);
  };

  const getTokenForContext = (tokenType: MapboxTokenType): string | null => {
    console.log(`MapboxProvider: Getting token for ${tokenType}`);
    
    // First try system settings (if initialized)
    if (isSettingsInitialized && !isSettingsLoading) {
      const systemToken = getMapboxToken(tokenType);
      if (systemToken) {
        console.log(`MapboxProvider: Using system token for ${tokenType}`);
        return systemToken;
      }
    }

    // Fallback to legacy token
    if (legacyToken && !isLegacyLoading) {
      console.log(`MapboxProvider: Using legacy token for ${tokenType}`);
      return legacyToken;
    }

    console.log(`MapboxProvider: No token found for ${tokenType}`);
    return null;
  };

  const getStyleForContext = (styleType: MapboxStyleType): string | null => {
    console.log(`MapboxProvider: Getting style for ${styleType}`);
    
    if (isSettingsInitialized && !isSettingsLoading) {
      const style = getMapboxStyle(styleType);
      if (style) {
        return style;
      }
    }

    // Default fallback styles
    const fallbackStyles = {
      'mapbox_style_property_list': 'mapbox://styles/mapbox/streets-v12',
      'mapbox_style_property_detail': 'mapbox://styles/mapbox/satellite-streets-v12',
      'mapbox_style_property_3d': 'mapbox://styles/mapbox/streets-v12',
      'mapbox_style_analytics': 'mapbox://styles/mapbox/light-v11'
    };
    
    return fallbackStyles[styleType] || 'mapbox://styles/mapbox/streets-v12';
  };

  // Simplified ready state calculation
  const isReady = !isLegacyLoading && (!isSettingsLoading || !isSettingsInitialized);
  const isLoading = isLegacyLoading || isSettingsLoading;
  
  // Get default token for backward compatibility
  const defaultToken = isReady ? getTokenForContext('mapbox_token_property_list') : null;

  console.log('MapboxProvider: Final state:', {
    defaultToken: !!defaultToken,
    isLoading,
    isReady,
    error
  });

  return (
    <MapboxContext.Provider value={{ 
      token: defaultToken, 
      isLoading, 
      setToken, 
      error,
      getTokenForContext,
      getStyleForContext,
      isReady,
      retryInitialization
    }}>
      {children}
    </MapboxContext.Provider>
  );
};
