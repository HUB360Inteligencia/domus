
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthCallback from "./pages/auth/AuthCallback";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PropertyFormPage from "./pages/PropertyFormPage";
import PropertyRoiReportPage from "./pages/PropertyRoiReportPage";
import ContractsPage from "./pages/ContractsPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import ContractFormPage from "./pages/ContractFormPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentFormPage from "./pages/DocumentFormPage";
import FinancesPage from "./pages/FinancesPage";
import FinanceDashboardPage from "./pages/finances/FinanceDashboardPage";
import ExpensesPage from "./pages/finances/ExpensesPage";
import IncomePage from "./pages/finances/IncomePage";
import ReportsPage from "./pages/finances/ReportsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import ActivityFormPage from "./pages/ActivityFormPage";
import UsersPage from "./pages/users/UsersPage";
import UserDetailPage from "./pages/users/UserDetailPage";
import UserInvitePage from "./pages/users/UserInvitePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientsPage from "./pages/admin/ClientsPage";
import ClientDetailPage from "./pages/admin/ClientDetailPage";
import ClientFormPage from "./pages/admin/ClientFormPage";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Index from "./pages/Index";
import { AppLayout } from "./components/layout/app-layout";
import { AdminLayout } from "./components/layout/admin-layout";
import { ProtectedRoute } from "./components/auth/protected-route";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";

function App() {
  // Check if running in a browser environment before accessing localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      // Retrieve the last URL from localStorage
      const lastUrl = localStorage.getItem('lastUrl');

      // If there's a last URL, remove it from localStorage
      if (lastUrl) {
        localStorage.removeItem('lastUrl');
      }
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="theme-preference">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes inside App Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          
          <Route path="properties">
            <Route index element={<Navigate to="/properties" replace />} />
          </Route>
          
          <Route path="contracts">
            <Route index element={<ContractsPage />} />
            <Route path="detail" element={<ContractDetailPage />} />
            <Route path="new" element={<ContractFormPage />} />
            <Route path="edit" element={<ContractFormPage />} />
          </Route>
          
          <Route path="documents">
            <Route index element={<DocumentsPage />} />
            <Route path="new" element={<DocumentFormPage />} />
          </Route>
          
          <Route path="finances">
            <Route index element={<FinancesPage />} />
            <Route path="dashboard" element={<FinanceDashboardPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          
          <Route path="activities">
            <Route index element={<ActivitiesPage />} />
            <Route path="detail" element={<ActivityDetailPage />} />
            <Route path="new" element={<ActivityFormPage />} />
            <Route path="edit" element={<ActivityFormPage />} />
          </Route>
          
          <Route path="users">
            <Route index element={<UsersPage />} />
            <Route path="detail" element={<UserDetailPage />} />
            <Route path="invite" element={<UserInvitePage />} />
          </Route>
        </Route>
        
        {/* Protected Routes outside App Layout */}
        <Route
          path="/properties"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Properties />} />
          <Route path="detail" element={<PropertyDetailPage />} />
          <Route path="new" element={<PropertyFormPage />} />
          <Route path="edit" element={<PropertyFormPage />} />
          <Route path="roi-report" element={<PropertyRoiReportPage />} />
        </Route>
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="clients">
            <Route index element={<ClientsPage />} />
            <Route path="detail" element={<ClientDetailPage />} />
            <Route path="new" element={<ClientFormPage />} />
            <Route path="edit" element={<ClientFormPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
