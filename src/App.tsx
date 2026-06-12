
import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/queryClient';
import { AuthProvider } from '@/components/auth/auth-provider';
import { MapboxProvider } from '@/contexts/MapboxContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppRoutes } from '@/routes/AppRoutes';

function AppInner() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MapboxProvider>
            <Toaster closeButton />
            <AppRoutes />
          </MapboxProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
