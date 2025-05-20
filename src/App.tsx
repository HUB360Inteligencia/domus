
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Index from './pages/Index';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyFormPage from './pages/PropertyFormPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

import { AppLayout } from './components/layout/app-layout';
import { ProtectedRoute } from './components/auth/protected-route';
import { AuthProvider } from './components/auth/auth-provider';
import { MapboxProvider } from './contexts/MapboxContext';

function App() {
  const queryClient = new QueryClient();

  return (
    <ThemeProvider defaultTheme="light" storageKey="lovable-theme">
      <QueryClientProvider client={queryClient}>
        <MapboxProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Properties Routes */}
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/detail" element={<PropertyDetailPage />} />
                  <Route path="/properties/new" element={<PropertyFormPage />} />
                  <Route path="/properties/edit" element={<PropertyFormPage />} />
                  
                  {/* Contracts Routes */}
                  <Route path="/contracts" element={<ContractsPage />} />
                  <Route path="/contracts/detail" element={<ContractDetailPage />} />
                  <Route path="/contracts/new" element={<PropertyFormPage />} />
                  <Route path="/contracts/edit" element={<PropertyFormPage />} />

                  {/* Documents Routes */}
                  <Route path="/documents" element={<DocumentsPage />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/unauthorized" element={<Unauthorized />} />
              </Routes>
            </Router>
          </AuthProvider>
        </MapboxProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
