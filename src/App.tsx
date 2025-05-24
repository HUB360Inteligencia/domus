
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/app-layout';
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import PropertiesPage from '@/pages/Properties';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import FinancesDashboardPage from '@/pages/finances/FinanceDashboardPage';
import FinancialTransactionsPage from '@/pages/finances/FinancialTransactionsPage';
import ReportsPage from '@/pages/finances/ReportsPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import AdvancedReportsPage from '@/pages/AdvancedReportsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return user ? (
    children
  ) : (
    <Navigate to="/login" />
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Navigate to="/properties" replace />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/properties" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PropertiesPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/properties/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PropertyDetailPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/finances" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FinancesDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FinancialTransactionsPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportsPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/advanced-reports" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdvancedReportsPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
