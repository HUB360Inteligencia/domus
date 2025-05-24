import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/app-layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import PropertiesPage from '@/pages/properties/PropertiesPage';
import PropertyDetailPage from '@/pages/properties/PropertyDetailPage';
import FinancesDashboardPage from '@/pages/finances/FinanceDashboardPage';
import FinancialTransactionsPage from '@/pages/finances/FinancialTransactionsPage';
import ReportsPage from '@/pages/finances/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import AdvancedReportsPage from '@/pages/AdvancedReportsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" />
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClient>
        <Toaster />
        <AuthProvider>
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
        </AuthProvider>
      </QueryClient>
    </BrowserRouter>
  );
}

export default App;
