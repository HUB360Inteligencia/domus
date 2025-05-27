
import React, { createContext, useContext, useState, useEffect } from 'react';

interface MapboxContextType {
  token: string | null;
  setToken: (token: string) => void;
  isConfigured: boolean;
}

const MapboxContext = createContext<MapboxContextType | undefined>(undefined);

export function MapboxProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    // Try to load token from localStorage on init
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setTokenState(savedToken);
    }
  }, []);

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem('mapbox_token', newToken);
  };

  const isConfigured = !!token;

  return (
    <MapboxContext.Provider value={{ token, setToken, isConfigured }}>
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
