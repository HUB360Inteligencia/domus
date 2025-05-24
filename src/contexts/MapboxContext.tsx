
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSystemSettings, MapboxTokenType, MapboxStyleType } from '@/hooks/use-system-settings';

interface MapboxContextType {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  error: string | null;
  getTokenForContext: (tokenType: MapboxTokenType) => string | null;
  getStyleForContext: (styleType: MapboxStyleType) => string | null;
  isTokenLoading: boolean;
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
  isTokenLoading: true,
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
  const [initializationKey, setInitializationKey] = useState(0);
  
  const { 
    getMapboxToken, 
    getMapboxStyle, 
    isLoading: isSettingsLoading, 
    error: settingsError,
    isInitialized: isSettingsInitialized 
  } = useSystemSettings();

  console.log('MapboxProvider: Render state:', { 
    isSettingsLoading, 
    isSettingsInitialized,
    settingsError, 
    legacyToken: !!legacyToken,
    isLegacyLoading,
    initializationKey
  });

  // Load legacy token from localStorage on mount
  useEffect(() => {
    console.log('MapboxProvider: Loading legacy token from localStorage');
    try {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedToken) {
        console.log('MapboxProvider: Legacy token found in localStorage');
        setLegacyTokenState(savedToken);
      } else {
        console.log('MapboxProvider: No legacy token in localStorage');
      }
    } catch (e) {
      console.error('MapboxProvider: Error loading legacy token:', e);
    } finally {
      setIsLegacyLoading(false);
    }
  }, [initializationKey]);

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
      console.log('MapboxProvider: Legacy token updated successfully');
    } catch (e) {
      console.error('MapboxProvider: Error saving legacy token:', e);
      setError('Failed to save token');
    }
  };

  const retryInitialization = () => {
    console.log('MapboxProvider: Retrying initialization');
    setError(null);
    setInitializationKey(prev => prev + 1);
  };

  const getTokenForContext = (tokenType: MapboxTokenType): string | null => {
    console.log(`MapboxProvider: Getting token for context: ${tokenType}`);
    console.log(`MapboxProvider: Settings initialized: ${isSettingsInitialized}`);
    
    // Wait for settings to be initialized
    if (!isSettingsInitialized) {
      console.log(`MapboxProvider: Settings not initialized, returning null for ${tokenType}`);
      return null;
    }
    
    // First try to get the token from system settings
    const systemToken = getMapboxToken(tokenType);
    if (systemToken) {
      console.log(`MapboxProvider: Found system token for ${tokenType}`);
      return systemToken;
    }

    // Fallback to legacy token for backward compatibility
    if (legacyToken && !isLegacyLoading) {
      console.log(`MapboxProvider: Using legacy token for ${tokenType}`);
      return legacyToken;
    }

    console.log(`MapboxProvider: No token found for ${tokenType}`);
    return null;
  };

  const getStyleForContext = (styleType: MapboxStyleType): string | null => {
    console.log(`MapboxProvider: Getting style for context: ${styleType}`);
    
    // Wait for settings to be initialized
    if (!isSettingsInitialized) {
      console.log(`MapboxProvider: Settings not initialized, returning fallback for ${styleType}`);
    } else {
      const style = getMapboxStyle(styleType);
      if (style) {
        console.log(`MapboxProvider: Found custom style for ${styleType}:`, style);
        return style;
      }
    }

    // Default fallback styles based on context
    const fallbackStyle = (() => {
      switch (styleType) {
        case 'mapbox_style_property_list':
          return 'mapbox://styles/mapbox/streets-v12';
        case 'mapbox_style_property_detail':
          return 'mapbox://styles/mapbox/satellite-streets-v12';
        case 'mapbox_style_property_3d':
          return 'mapbox://styles/mapbox/streets-v12';
        case 'mapbox_style_analytics':
          return 'mapbox://styles/mapbox/light-v11';
        default:
          return 'mapbox://styles/mapbox/streets-v12';
      }
    })();
    
    console.log(`MapboxProvider: Using fallback style for ${styleType}:`, fallbackStyle);
    return fallbackStyle;
  };

  // Calculate loading and ready states
  const isTokenLoading = isSettingsLoading || isLegacyLoading || !isSettingsInitialized;
  const isReady = isSettingsInitialized && !isLegacyLoading && !error;
  
  // For backward compatibility, return property_list token as default
  const defaultToken = isReady ? getTokenForContext('mapbox_token_property_list') : null;

  console.log('MapboxProvider: Final state:', {
    defaultToken: !!defaultToken,
    isTokenLoading,
    isReady,
    error,
    tokenLength: defaultToken?.length || 0,
    isSettingsInitialized,
    isLegacyLoading
  });

  return (
    <MapboxContext.Provider value={{ 
      token: defaultToken, 
      isLoading: isTokenLoading, 
      setToken, 
      error,
      getTokenForContext,
      getStyleForContext,
      isTokenLoading,
      isReady,
      retryInitialization
    }}>
      {children}
    </MapboxContext.Provider>
  );
};
