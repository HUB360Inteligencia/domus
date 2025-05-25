
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/app-layout';
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import PropertiesPage from '@/pages/Properties';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import PropertyFormPage from '@/pages/PropertyFormPage';
import PropertiesMapPage from '@/pages/PropertiesMapPage';
import ContractsPage from '@/pages/ContractsPage';
import ContractDetailPage from '@/pages/ContractDetailPage';
import ContractFormPage from '@/pages/ContractFormPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import UsersPage from '@/pages/users/UsersPage';
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

// Component to handle old property detail route redirect
function PropertyDetailRedirect() {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');
  
  if (id) {
    return <Navigate to={`/properties/${id}`} replace />;
  }
  
  return <Navigate to="/properties" replace />;
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
                  <Navigate to="/dashboard" replace />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
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
          
          {/* Redirect old property detail route to new format */}
          <Route 
            path="/properties/detail" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PropertyDetailRedirect />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/properties/new" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PropertyFormPage />
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
            path="/properties/:id/edit" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PropertyFormPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/properties/map" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PropertiesMapPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/contracts" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContractsPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/contracts/new" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContractFormPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/contracts/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContractDetailPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/contracts/:id/edit" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ContractFormPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/schedules" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ActivitiesPage />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UsersPage />
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
