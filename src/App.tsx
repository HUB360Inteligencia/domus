
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Toaster } from "sonner";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthCallback from "./pages/auth/AuthCallback";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// App Pages
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PropertyFormPage from "./pages/PropertyFormPage";
import ContractsPage from "./pages/ContractsPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import ContractFormPage from "./pages/ContractFormPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import ActivityFormPage from "./pages/ActivityFormPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentFormPage from "./pages/DocumentFormPage";
import UsersPage from "./pages/users/UsersPage";
import UserDetailPage from "./pages/users/UserDetailPage";
import UserInvitePage from "./pages/users/UserInvitePage";
import FinancesPage from "./pages/FinancesPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientsPage from "./pages/admin/ClientsPage";
import ClientDetailPage from "./pages/admin/ClientDetailPage";
import ClientFormPage from "./pages/admin/ClientFormPage";

// Layouts
import { AppLayout } from "./components/layout/app-layout";
import { AdminLayout } from "./components/layout/admin-layout";

// Protected Route Component
import { ProtectedRoute } from "./components/auth/protected-route";

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const supabase = useSupabaseClient();
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Check if the user is already authenticated
      if (session) {
        // Optionally, you can fetch additional user data here if needed
        // and redirect to a specific page based on user role, etc.
        navigate("/dashboard");
      } else {
        // If no session, navigate to the login page
        // or any other public page
        navigate("/login");
      }
      setIsAuthReady(true);
    };

    checkAuth();
  }, [session, navigate]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/properties/new" element={<PropertyFormPage />} />
          <Route path="/properties/:id/edit" element={<PropertyFormPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/contracts/new" element={<ContractFormPage />} />
          <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/activities/new" element={<ActivityFormPage />} />
          <Route path="/activities/:id/edit" element={<ActivityFormPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/new" element={<DocumentFormPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/users/invite" element={<UserInvitePage />} />
          <Route path="/finances" element={<FinancesPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredPermission="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="clients/new" element={<ClientFormPage />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
