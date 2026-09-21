
import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/queryClient';
import { AuthProvider } from '@/components/auth/auth-provider';
import { MapboxProvider } from '@/contexts/MapboxContext';
import { OwnershipViewProvider } from '@/contexts/OwnershipViewContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppRoutes } from '@/routes/AppRoutes';
import { ConfirmProvider } from '@/components/ui/confirm-provider';
import { PasswordRecoveryGate } from '@/components/auth/password-recovery-gate';

function AppInner() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MapboxProvider>
            <OwnershipViewProvider>
              <ConfirmProvider>
                <Toaster closeButton richColors />
                <PasswordRecoveryGate />
                <AppRoutes />
              </ConfirmProvider>
            </OwnershipViewProvider>
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
