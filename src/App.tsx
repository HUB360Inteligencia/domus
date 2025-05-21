
import { Route, Routes } from 'react-router-dom';

import './App.css';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyFormPage from './pages/PropertyFormPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ContractsPage from './pages/ContractsPage';
import ContractFormPage from './pages/ContractFormPage';
import ContractDetailPage from './pages/ContractDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentFormPage from './pages/DocumentFormPage';
import ActivitiesPage from './pages/ActivitiesPage';
import UsersPage from './pages/users/UsersPage';
import UserDetailPage from './pages/users/UserDetailPage';
import UserInvitePage from './pages/users/UserInvitePage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientsPage from './pages/admin/ClientsPage';
import ClientFormPage from './pages/admin/ClientFormPage';
import ClientDetailPage from './pages/admin/ClientDetailPage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import { AppLayout } from './components/layout/app-layout';
import { AdminLayout } from './components/layout/admin-layout';
import { RequireAuth } from './components/auth/require-auth';
import { RequireAdmin } from './components/auth/require-admin';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './components/auth/auth-provider';
import { Toaster } from './components/ui/sonner';
import { MapboxProvider } from './contexts/MapboxContext';
import FinancesPage from './pages/FinancesPage';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <MapboxProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* App routes */}
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route index element={<Dashboard />} />
              <Route path="properties">
                <Route index element={<Properties />} />
                <Route path="new" element={<PropertyFormPage />} />
                <Route path=":id" element={<PropertyDetailPage />} />
                <Route path="edit/:id" element={<PropertyFormPage />} />
              </Route>
              <Route path="finances" element={<FinancesPage />} />
              <Route path="contracts">
                <Route index element={<ContractsPage />} />
                <Route path="new" element={<ContractFormPage />} />
                <Route path=":id" element={<ContractDetailPage />} />
                <Route path="edit/:id" element={<ContractFormPage />} />
              </Route>
              <Route path="documents">
                <Route index element={<DocumentsPage />} />
                <Route path="new" element={<DocumentFormPage />} />
              </Route>
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="users">
                <Route index element={<UsersPage />} />
                <Route path=":id" element={<UserDetailPage />} />
                <Route path="invite" element={<UserInvitePage />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/clients">
                <Route index element={<ClientsPage />} />
                <Route path="new" element={<ClientFormPage />} />
                <Route path=":id" element={<ClientDetailPage />} />
              </Route>
            </Route>

            {/* Error routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </MapboxProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
