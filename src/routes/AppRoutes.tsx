import React, { Suspense } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth";
import { lazyWithRetry } from "@/utils/lazy-with-retry";
import { Loader2 } from "lucide-react";

// Fallback loader para Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Lazy imports - Páginas principais
const Index = lazyWithRetry(() => import("@/pages/Index"));
const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
const Properties = lazyWithRetry(() => import("@/pages/Properties"));
const PropertyDetailPage = lazyWithRetry(() => import("@/pages/PropertyDetailPage"));
const PropertyFormPage = lazyWithRetry(() => import("@/pages/PropertyFormPage"));
const PropertiesMapPage = lazyWithRetry(() => import("@/pages/PropertiesMapPage"));
const ContractsPage = lazyWithRetry(() => import("@/pages/ContractsPage"));
const ContractDetailPage = lazyWithRetry(() => import("@/pages/ContractDetailPage"));
const ContractFormPage = lazyWithRetry(() => import("@/pages/ContractFormPage"));
const ContactsPage = lazyWithRetry(() => import("@/pages/ContactsPage"));
const ContactDetailPage = lazyWithRetry(() => import("@/pages/ContactDetailPage"));
const ContactFormPage = lazyWithRetry(() => import("@/pages/ContactFormPage"));
const AgendaPage = lazyWithRetry(() => import("@/pages/AgendaPage"));
const DocumentsPage = lazyWithRetry(() => import("@/pages/DocumentsPage"));
const DocumentFormPage = lazyWithRetry(() => import("@/pages/DocumentFormPage"));
const FinancesPage = lazyWithRetry(() => import("@/pages/FinancesPage"));
const DevelopmentsPage = lazyWithRetry(() => import("@/pages/DevelopmentsPage"));
const DevelopmentDetailPage = lazyWithRetry(() => import("@/pages/DevelopmentDetailPage"));
const DevelopmentFormPage = lazyWithRetry(() => import("@/pages/DevelopmentFormPage"));
const AdvancedReportsPage = lazyWithRetry(() => import("@/pages/AdvancedReportsPage"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));
const Unauthorized = lazyWithRetry(() => import("@/pages/Unauthorized"));

// Lazy imports - Páginas de autenticação
const Login = lazyWithRetry(() => import("@/pages/auth/Login"));
const Register = lazyWithRetry(() => import("@/pages/auth/Register"));
const AuthCallback = lazyWithRetry(() => import("@/pages/auth/AuthCallback"));
const ResetPassword = lazyWithRetry(() => import("@/pages/auth/ResetPassword"));

// Lazy imports - Páginas de finanças
const FinanceDashboardPage = lazyWithRetry(() => import("@/pages/finances/FinanceDashboardPage"));
const FinancialTransactionsPage = lazyWithRetry(() => import("@/pages/finances/FinancialTransactionsPage"));
const IncomePage = lazyWithRetry(() => import("@/pages/finances/IncomePage"));
const ExpensesPage = lazyWithRetry(() => import("@/pages/finances/ExpensesPage"));
const ReportsPage = lazyWithRetry(() => import("@/pages/finances/ReportsPage"));

// Lazy imports - Páginas de usuários
const UsersPage = lazyWithRetry(() => import("@/pages/users/UsersPage"));
const UserDetailPage = lazyWithRetry(() => import("@/pages/users/UserDetailPage"));
const UserInvitePage = lazyWithRetry(() => import("@/pages/users/UserInvitePage"));

// Lazy imports - Configurações da organização
const OrgSettingsPage = lazyWithRetry(() => import("@/pages/settings/OrgSettingsPage"));
const ProfilePage = lazyWithRetry(() => import("@/pages/settings/ProfilePage"));

// Lazy imports - Páginas de admin
const AdminDashboard = lazyWithRetry(() => import("@/pages/admin/AdminDashboard"));
const ClientsPage = lazyWithRetry(() => import("@/pages/admin/ClientsPage"));
const ClientFormPage = lazyWithRetry(() => import("@/pages/admin/ClientFormPage"));
const ClientDetailPage = lazyWithRetry(() => import("@/pages/admin/ClientDetailPage"));
const SubscriptionFormPage = lazyWithRetry(() => import("@/pages/admin/SubscriptionFormPage"));
const SettingsPage = lazyWithRetry(() => import("@/pages/admin/SettingsPage"));

// Lazy imports - Redirecionamento
const PropertyDetailRedirect = lazyWithRetry(() => import("@/routes/PropertyDetailRedirect"));

/**
 * Layout wrapper for authenticated pages using AppLayout
 */
function ProtectedAppLayout() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {user?.role === "system_admin" ? (
        <Navigate to="/admin" replace />
      ) : (
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </AppLayout>
      )}
    </ProtectedRoute>
  );
}

/**
 * Layout wrapper for pages requiring manage_users permission
 */
function ProtectedUsersLayout() {
  return (
    <ProtectedRoute requiredPermission="manage_users">
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

/**
 * Layout wrapper for admin pages using AdminLayout
 */
function ProtectedAdminLayout() {
  return (
    <ProtectedRoute requiredPermission="admin_access" requiredRole="system_admin">
      <AdminLayout>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Páginas de autenticação - sem layout */}
      <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
      <Route path="/register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
      <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
      <Route path="/auth/callback" element={<Suspense fallback={<PageLoader />}><AuthCallback /></Suspense>} />

      {/* Página inicial - sem layout */}
      <Route path="/" element={<Suspense fallback={<PageLoader />}><Index /></Suspense>} />

      {/* Redirecionamento legado */}
      <Route path="/property/:id" element={<Suspense fallback={<PageLoader />}><PropertyDetailRedirect /></Suspense>} />

      {/* ─── Páginas protegidas com AppLayout ─── */}
      <Route element={<ProtectedAppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Imóveis */}
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/map" element={<PropertiesMapPage />} />
        <Route path="/properties/new" element={<PropertyFormPage />} />
        <Route path="/properties/edit/:id" element={<PropertyFormPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />

        {/* Contratos */}
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/new" element={<ContractFormPage />} />
        <Route path="/contracts/edit/:id" element={<ContractFormPage />} />
        <Route path="/contracts/:id" element={<ContractDetailPage />} />

        {/* Contatos */}
        <Route
          path="/contacts"
          element={<ProtectedRoute requiredPermission="contacts.view"><ContactsPage /></ProtectedRoute>}
        />
        <Route
          path="/contacts/new"
          element={<ProtectedRoute requiredPermission="contacts.create"><ContactFormPage /></ProtectedRoute>}
        />
        <Route
          path="/contacts/edit/:id"
          element={<ProtectedRoute requiredPermission="contacts.edit"><ContactFormPage /></ProtectedRoute>}
        />
        <Route
          path="/contacts/:id"
          element={<ProtectedRoute requiredPermission="contacts.view"><ContactDetailPage /></ProtectedRoute>}
        />

        {/* Agenda */}
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/agenda/new" element={<AgendaPage />} />
        <Route path="/activities" element={<AgendaPage />} />
        <Route path="/activities/new" element={<Navigate to="/agenda?new=1" replace />} />
        <Route path="/activities/edit/:id" element={<Navigate to="/agenda" replace />} />
        <Route path="/activities/:id" element={<Navigate to="/agenda" replace />} />

        {/* Documentos */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/new" element={<DocumentFormPage />} />

        {/* Finanças */}
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/finances/dashboard" element={<FinanceDashboardPage />} />
        <Route path="/finances/transactions" element={<FinancialTransactionsPage />} />
        <Route path="/finances/income" element={<IncomePage />} />
        <Route path="/finances/expenses" element={<ExpensesPage />} />
        <Route path="/finances/reports" element={<ReportsPage />} />

        {/* Empreendimentos */}
        <Route path="/developments" element={<DevelopmentsPage />} />
        <Route path="/developments/new" element={<DevelopmentFormPage />} />
        <Route path="/developments/edit/:id" element={<DevelopmentFormPage />} />
        <Route path="/developments/:id" element={<DevelopmentDetailPage />} />

        {/* Relatórios */}
        <Route path="/reports" element={<AdvancedReportsPage />} />

        {/* Configurações da organização (admin da org) */}
        <Route path="/settings/organization" element={<OrgSettingsPage />} />

        {/* Perfil do Usuário */}
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* ─── Páginas de gestão de usuários (legado / master) ─── */}
      <Route element={<ProtectedUsersLayout />}>
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/invite" element={<UserInvitePage />} />
        <Route path="/users/:userId" element={<UserDetailPage />} />
      </Route>

      {/* ─── Páginas de admin ─── */}
      <Route element={<ProtectedAdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/clients" element={<ClientsPage />} />
        <Route path="/admin/clients/new" element={<ClientFormPage />} />
        <Route path="/admin/clients/edit/:clientId" element={<ClientFormPage />} />
        <Route path="/admin/clients/:id" element={<ClientDetailPage />} />
        <Route path="/admin/subscriptions/new" element={<SubscriptionFormPage />} />
        <Route path="/admin/subscriptions/edit/:id" element={<SubscriptionFormPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      {/* Páginas de erro - sem layout */}
      <Route path="/unauthorized" element={<Suspense fallback={<PageLoader />}><Unauthorized /></Suspense>} />
      <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
    </Routes>
  );
}
