
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/protected-route";

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
      {/* Páginas de autenticação */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Página inicial */}
      <Route path="/" element={<Index />} />
      
      {/* Páginas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Imóveis */}
      <Route path="/properties" element={
        <ProtectedRoute>
          <Properties />
        </ProtectedRoute>
      } />
      <Route path="/properties/map" element={
        <ProtectedRoute>
          <PropertiesMapPage />
        </ProtectedRoute>
      } />
      <Route path="/properties/new" element={
        <ProtectedRoute>
          <PropertyFormPage />
        </ProtectedRoute>
      } />
      <Route path="/properties/edit/:id" element={
        <ProtectedRoute>
          <PropertyFormPage />
        </ProtectedRoute>
      } />
      <Route path="/properties/:id" element={
        <ProtectedRoute>
          <PropertyDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/property/:id" element={<PropertyDetailRedirect />} />
      
      {/* Contratos */}
      <Route path="/contracts" element={
        <ProtectedRoute>
          <ContractsPage />
        </ProtectedRoute>
      } />
      <Route path="/contracts/new" element={
        <ProtectedRoute>
          <ContractFormPage />
        </ProtectedRoute>
      } />
      <Route path="/contracts/edit/:id" element={
        <ProtectedRoute>
          <ContractFormPage />
        </ProtectedRoute>
      } />
      <Route path="/contracts/:id" element={
        <ProtectedRoute>
          <ContractDetailPage />
        </ProtectedRoute>
      } />
      
      {/* Atividades */}
      <Route path="/activities" element={
        <ProtectedRoute>
          <ActivitiesPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/new" element={
        <ProtectedRoute>
          <ActivityFormPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/edit/:id" element={
        <ProtectedRoute>
          <ActivityFormPage />
        </ProtectedRoute>
      } />
      <Route path="/activities/:id" element={
        <ProtectedRoute>
          <ActivityDetailPage />
        </ProtectedRoute>
      } />
      
      {/* Documentos */}
      <Route path="/documents" element={
        <ProtectedRoute>
          <DocumentsPage />
        </ProtectedRoute>
      } />
      <Route path="/documents/new" element={
        <ProtectedRoute>
          <DocumentFormPage />
        </ProtectedRoute>
      } />
      
      {/* Finanças */}
      <Route path="/finances" element={
        <ProtectedRoute>
          <FinancesPage />
        </ProtectedRoute>
      } />
      <Route path="/finances/dashboard" element={
        <ProtectedRoute>
          <FinanceDashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/finances/transactions" element={
        <ProtectedRoute>
          <FinancialTransactionsPage />
        </ProtectedRoute>
      } />
      <Route path="/finances/income" element={
        <ProtectedRoute>
          <IncomePage />
        </ProtectedRoute>
      } />
      <Route path="/finances/expenses" element={
        <ProtectedRoute>
          <ExpensesPage />
        </ProtectedRoute>
      } />
      <Route path="/finances/reports" element={
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      } />
      
      {/* Empreendimentos */}
      <Route path="/developments" element={
        <ProtectedRoute>
          <DevelopmentsPage />
        </ProtectedRoute>
      } />
      <Route path="/developments/new" element={
        <ProtectedRoute>
          <DevelopmentFormPage />
        </ProtectedRoute>
      } />
      <Route path="/developments/edit/:id" element={
        <ProtectedRoute>
          <DevelopmentFormPage />
        </ProtectedRoute>
      } />
      <Route path="/developments/:id" element={
        <ProtectedRoute>
          <DevelopmentDetailPage />
        </ProtectedRoute>
      } />
      
      {/* Relatórios */}
      <Route path="/reports" element={
        <ProtectedRoute>
          <AdvancedReportsPage />
        </ProtectedRoute>
      } />
      
      {/* Usuários */}
      <Route path="/users" element={
        <ProtectedRoute requiredPermission="manage_users">
          <UsersPage />
        </ProtectedRoute>
      } />
      <Route path="/users/invite" element={
        <ProtectedRoute requiredPermission="manage_users">
          <UserInvitePage />
        </ProtectedRoute>
      } />
      <Route path="/users/:id" element={
        <ProtectedRoute requiredPermission="manage_users">
          <UserDetailPage />
        </ProtectedRoute>
      } />
      
      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requiredPermission="admin_access">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/clients" element={
        <ProtectedRoute requiredPermission="admin_access">
          <ClientsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/clients/new" element={
        <ProtectedRoute requiredPermission="admin_access">
          <ClientFormPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/clients/edit/:id" element={
        <ProtectedRoute requiredPermission="admin_access">
          <ClientFormPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/clients/:id" element={
        <ProtectedRoute requiredPermission="admin_access">
          <ClientDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/subscriptions/new" element={
        <ProtectedRoute requiredPermission="admin_access">
          <SubscriptionFormPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/subscriptions/edit/:id" element={
        <ProtectedRoute requiredPermission="admin_access">
          <SubscriptionFormPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute requiredPermission="admin_access">
          <SettingsPage />
        </ProtectedRoute>
      } />
      
      {/* Páginas de erro */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
