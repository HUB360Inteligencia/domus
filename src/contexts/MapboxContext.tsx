import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface MapboxContextType {
  token: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
  retryInitialization: () => void;
}

const MapboxContext = createContext<MapboxContextType | undefined>(undefined);

export function MapboxProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeMapbox = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const configuredToken = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined)?.trim();
    if (!configuredToken?.startsWith('pk.')) {
      setToken(null);
      setError('Token público do Mapbox não configurado ou inválido.');
      setIsLoading(false);
      return;
    }

    setToken(configuredToken);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeMapbox();
  }, [initializeMapbox]);

  const value = useMemo<MapboxContextType>(
    () => ({
      token,
      isConfigured: Boolean(token),
      isLoading,
      error,
      isReady: !isLoading && Boolean(token) && !error,
      retryInitialization: initializeMapbox,
    }),
    [error, initializeMapbox, isLoading, token],
  );

  return <MapboxContext.Provider value={value}>{children}</MapboxContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMapbox() {
  const context = useContext(MapboxContext);
  if (!context) throw new Error('useMapbox deve ser usado dentro de MapboxProvider');
  return context;
}
