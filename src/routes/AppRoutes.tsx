
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from './ProtectedRoute';
import { PropertyDetailRedirect } from './PropertyDetailRedirect';

// Auth Pages
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';

// Main Pages
import Dashboard from '@/pages/Dashboard';
import PropertiesPage from '@/pages/Properties';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import PropertyFormPage from '@/pages/PropertyFormPage';
import PropertiesMapPage from '@/pages/PropertiesMapPage';
import ContractsPage from '@/pages/ContractsPage';
import ContractDetailPage from '@/pages/ContractDetailPage';
import ContractFormPage from '@/pages/ContractFormPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import ActivityFormPage from '@/pages/ActivityFormPage';
import ActivityDetailPage from '@/pages/ActivityDetailPage';
import UsersPage from '@/pages/users/UsersPage';

// Finance Pages
import FinancesDashboardPage from '@/pages/finances/FinanceDashboardPage';
import FinancialTransactionsPage from '@/pages/finances/FinancialTransactionsPage';
import ReportsPage from '@/pages/finances/ReportsPage';

// Admin Pages
import SettingsPage from '@/pages/admin/SettingsPage';
import AdvancedReportsPage from '@/pages/AdvancedReportsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Main Routes */}
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
      
      {/* Properties Routes */}
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
      
      {/* Contracts Routes */}
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
      
      {/* Activities Routes */}
      <Route 
        path="/activities" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActivitiesPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/activities/new" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActivityFormPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/activities/:id" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActivityDetailPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/activities/:id/edit" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActivityFormPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy redirect for schedules */}
      <Route 
        path="/schedules" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/activities" replace />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Users Routes */}
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
      
      {/* Finance Routes */}
      <Route 
        path="/finances" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/finances/dashboard" replace />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/finances/dashboard" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <FinancesDashboardPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/finances/income" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/finances/transactions?tab=income" replace />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/finances/expenses" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/finances/transactions?tab=expense" replace />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/finances/transactions" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <FinancialTransactionsPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/finances/reports" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      {/* Legacy routes - redirect to new finance structure */}
      <Route 
        path="/transactions" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/finances/transactions" replace />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/finances/reports" replace />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
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
  );
}
