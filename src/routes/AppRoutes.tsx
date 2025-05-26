
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/app-layout';
import { AdminLayout } from '@/components/layout/admin-layout';
import ProtectedRoute from './ProtectedRoute';

// Import pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import PropertyFormPage from '@/pages/PropertyFormPage';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import PropertiesMapPage from '@/pages/PropertiesMapPage';
import FinancesPage from '@/pages/FinancesPage';
import FinanceDashboardPage from '@/pages/finances/FinanceDashboardPage';
import FinancialTransactionsPage from '@/pages/finances/FinancialTransactionsPage';
import IncomePage from '@/pages/finances/IncomePage';
import ExpensesPage from '@/pages/finances/ExpensesPage';
import ReportsPage from '@/pages/finances/ReportsPage';
import ContractsPage from '@/pages/ContractsPage';
import ContractFormPage from '@/pages/ContractFormPage';
import ContractDetailPage from '@/pages/ContractDetailPage';
import DocumentsPage from '@/pages/DocumentsPage';
import DocumentFormPage from '@/pages/DocumentFormPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import ActivityFormPage from '@/pages/ActivityFormPage';
import ActivityDetailPage from '@/pages/ActivityDetailPage';
import DevelopmentsPage from '@/pages/DevelopmentsPage';
import DevelopmentFormPage from '@/pages/DevelopmentFormPage';
import DevelopmentDetailPage from '@/pages/DevelopmentDetailPage';
import AdvancedReportsPage from '@/pages/AdvancedReportsPage';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import AuthCallback from '@/pages/auth/AuthCallback';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ClientsPage from '@/pages/admin/ClientsPage';
import ClientFormPage from '@/pages/admin/ClientFormPage';
import ClientDetailPage from '@/pages/admin/ClientDetailPage';
import UsersPage from '@/pages/users/UsersPage';
import UserDetailPage from '@/pages/users/UserDetailPage';
import UserInvitePage from '@/pages/users/UserInvitePage';
import SettingsPage from '@/pages/admin/SettingsPage';

// Error pages
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';

// Redirect component
import PropertyDetailRedirect from './PropertyDetailRedirect';

export default function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Index />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Properties routes */}
      <Route path="/properties" element={
        <ProtectedRoute>
          <AppLayout>
            <Properties />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/properties/new" element={
        <ProtectedRoute>
          <AppLayout>
            <PropertyFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/properties/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <PropertyFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/properties/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <PropertyDetailPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/properties/map" element={
        <ProtectedRoute>
          <AppLayout>
            <PropertiesMapPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Finance routes */}
      <Route path="/finances" element={
        <ProtectedRoute>
          <AppLayout>
            <FinancesPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/finances/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <FinanceDashboardPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/finances/transactions" element={
        <ProtectedRoute>
          <AppLayout>
            <FinancialTransactionsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/finances/income" element={
        <ProtectedRoute>
          <AppLayout>
            <IncomePage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/finances/expenses" element={
        <ProtectedRoute>
          <AppLayout>
            <ExpensesPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/finances/reports" element={
        <ProtectedRoute>
          <AppLayout>
            <ReportsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Contracts routes */}
      <Route path="/contracts" element={
        <ProtectedRoute>
          <AppLayout>
            <ContractsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/contracts/new" element={
        <ProtectedRoute>
          <AppLayout>
            <ContractFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/contracts/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <ContractFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/contracts/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <ContractDetailPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Documents routes */}
      <Route path="/documents" element={
        <ProtectedRoute>
          <AppLayout>
            <DocumentsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/documents/new" element={
        <ProtectedRoute>
          <AppLayout>
            <DocumentFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Activities routes */}
      <Route path="/activities" element={
        <ProtectedRoute>
          <AppLayout>
            <ActivitiesPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/activities/new" element={
        <ProtectedRoute>
          <AppLayout>
            <ActivityFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/activities/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <ActivityFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/activities/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <ActivityDetailPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Developments routes */}
      <Route path="/developments" element={
        <ProtectedRoute>
          <AppLayout>
            <DevelopmentsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/developments/new" element={
        <ProtectedRoute>
          <AppLayout>
            <DevelopmentFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/developments/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <DevelopmentFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/developments/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <DevelopmentDetailPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Advanced Reports */}
      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout>
            <AdvancedReportsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/clients" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <ClientsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/clients/new" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <ClientFormPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/clients/:id" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <ClientDetailPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <UsersPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users/:id" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <UserDetailPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users/invite" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <UserInvitePage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/settings" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <SettingsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Legacy redirect for property details */}
      <Route path="/property/:id" element={<PropertyDetailRedirect />} />

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
