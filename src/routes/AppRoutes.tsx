
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { AdminLayout } from "@/components/layout/admin-layout";

// Páginas principais
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
import PropertyFormPage from "@/pages/PropertyFormPage";
import PropertiesMapPage from "@/pages/PropertiesMapPage";
import ContractsPage from "@/pages/ContractsPage";
import ContractDetailPage from "@/pages/ContractDetailPage";
import ContractFormPage from "@/pages/ContractFormPage";
import ActivitiesPage from "@/pages/ActivitiesPage";
import ActivityDetailPage from "@/pages/ActivityDetailPage";
import ActivityFormPage from "@/pages/ActivityFormPage";
import DocumentsPage from "@/pages/DocumentsPage";
import DocumentFormPage from "@/pages/DocumentFormPage";
import FinancesPage from "@/pages/FinancesPage";
import DevelopmentsPage from "@/pages/DevelopmentsPage";
import DevelopmentDetailPage from "@/pages/DevelopmentDetailPage";
import DevelopmentFormPage from "@/pages/DevelopmentFormPage";
import AdvancedReportsPage from "@/pages/AdvancedReportsPage";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";

// Páginas de autenticação
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AuthCallback from "@/pages/auth/AuthCallback";

// Páginas de finanças
import FinanceDashboardPage from "@/pages/finances/FinanceDashboardPage";
import FinancialTransactionsPage from "@/pages/finances/FinancialTransactionsPage";
import IncomePage from "@/pages/finances/IncomePage";
import ExpensesPage from "@/pages/finances/ExpensesPage";
import ReportsPage from "@/pages/finances/ReportsPage";

// Páginas de usuários
import UsersPage from "@/pages/users/UsersPage";
import UserDetailPage from "@/pages/users/UserDetailPage";
import UserInvitePage from "@/pages/users/UserInvitePage";

// Páginas de admin
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ClientsPage from "@/pages/admin/ClientsPage";
import ClientFormPage from "@/pages/admin/ClientFormPage";
import ClientDetailPage from "@/pages/admin/ClientDetailPage";
import SubscriptionFormPage from "@/pages/admin/SubscriptionFormPage";
import SettingsPage from "@/pages/admin/SettingsPage";

// Redirecionamento
import PropertyDetailRedirect from "@/routes/PropertyDetailRedirect";

export function AppRoutes() {
  return (
    <Routes>
      {/* Páginas de autenticação - sem layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Página inicial - sem layout */}
      <Route path="/" element={<Index />} />
      
      {/* Páginas protegidas com AppLayout */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      {/* Imóveis */}
      <Route path="/properties" element={
        <ProtectedRoute>
          <AppLayout>
            <Properties />
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
      <Route path="/properties/new" element={
        <ProtectedRoute>
          <AppLayout>
            <PropertyFormPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/properties/edit/:id" element={
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
      <Route path="/property/:id" element={<PropertyDetailRedirect />} />
      
      {/* Contratos */}
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
      <Route path="/contracts/edit/:id" element={
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
      
      {/* Atividades */}
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
      <Route path="/activities/edit/:id" element={
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
      
      {/* Documentos */}
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
      
      {/* Finanças */}
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
      
      {/* Empreendimentos */}
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
      <Route path="/developments/edit/:id" element={
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
      
      {/* Relatórios */}
      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout>
            <AdvancedReportsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      {/* Usuários */}
      <Route path="/users" element={
        <ProtectedRoute requiredPermission="manage_users">
          <AppLayout>
            <UsersPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users/invite" element={
        <ProtectedRoute requiredPermission="manage_users">
          <AppLayout>
            <UserInvitePage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users/:id" element={
        <ProtectedRoute requiredPermission="manage_users">
          <AppLayout>
            <UserDetailPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin - usando AdminLayout */}
      <Route path="/admin" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clients" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <ClientsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clients/new" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <ClientFormPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clients/edit/:id" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <ClientFormPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clients/:id" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <ClientDetailPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/subscriptions/new" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <SubscriptionFormPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/subscriptions/edit/:id" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <SubscriptionFormPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminLayout>
            <SettingsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Páginas de erro - sem layout */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
