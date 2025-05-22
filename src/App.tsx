
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Auth Pages
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));

// App Pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Properties = lazy(() => import("@/pages/Properties"));
const PropertyDetailPage = lazy(() => import("@/pages/PropertyDetailPage"));
const PropertyFormPage = lazy(() => import("@/pages/PropertyFormPage"));
const ContractsPage = lazy(() => import("@/pages/ContractsPage"));
const ContractDetailPage = lazy(() => import("@/pages/ContractDetailPage"));
const ContractFormPage = lazy(() => import("@/pages/ContractFormPage")); 
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage"));
const DocumentFormPage = lazy(() => import("@/pages/DocumentFormPage"));

// Activities Pages
const ActivitiesPage = lazy(() => import("@/pages/ActivitiesPage"));
const ActivityFormPage = lazy(() => import("@/pages/ActivityFormPage"));
const ActivityDetailPage = lazy(() => import("@/pages/ActivityDetailPage"));

// Users Pages
const UsersPage = lazy(() => import("@/pages/users/UsersPage"));
const UserDetailPage = lazy(() => import("@/pages/users/UserDetailPage"));
const UserInvitePage = lazy(() => import("@/pages/users/UserInvitePage"));

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminClientsPage = lazy(() => import("@/pages/admin/ClientsPage"));
const ClientDetailPage = lazy(() => import("@/pages/admin/ClientDetailPage"));
const ClientFormPage = lazy(() => import("@/pages/admin/ClientFormPage"));

// Error Pages
const NotFound = lazy(() => import("@/pages/NotFound"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));

// Landing Page
const Index = lazy(() => import("@/pages/Index"));

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-petroleum" />
              </div>
            }
          >
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
              </Route>

              <Route
                path="/properties"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Properties />} />
                <Route path="new" element={<PropertyFormPage />} />
                <Route path="edit" element={<PropertyFormPage />} />
                <Route path="detail" element={<PropertyDetailPage />} />
              </Route>

              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ContractsPage />} />
                <Route path="detail" element={<ContractDetailPage />} />
                <Route path="new" element={<ContractFormPage />} />
                <Route path="edit" element={<ContractFormPage />} /> 
              </Route>

              {/* New Activities Routes */}
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ActivitiesPage />} />
                <Route path="new" element={<ActivityFormPage />} />
                <Route path="edit" element={<ActivityFormPage />} />
                <Route path="detail" element={<ActivityDetailPage />} />
              </Route>

              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DocumentsPage />} />
                <Route path="new" element={<DocumentFormPage />} />
                <Route path="view" element={<NotFound />} />
              </Route>

              {/* User Management Routes */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPermission="users.view">
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<UsersPage />} />
                <Route path=":userId" element={<UserDetailPage />} />
                <Route path="invite" element={<UserInvitePage />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredPermission="clients.view">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="clients" element={<AdminClientsPage />} />
                <Route path="clients/:clientId" element={<ClientDetailPage />} />
                <Route path="clients/new" element={<ClientFormPage />} />
                <Route path="clients/edit/:clientId" element={<ClientFormPage />} />
                <Route path="plans" element={<div>Planos (em desenvolvimento)</div>} />
                <Route path="subscriptions" element={<div>Assinaturas (em desenvolvimento)</div>} />
                <Route path="subscriptions/new" element={<div>Nova Assinatura (em desenvolvimento)</div>} />
              </Route>

              {/* Error routes */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
          <SonnerToaster position="top-right" richColors />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
