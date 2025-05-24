
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/app-layout';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import PropertyFormPage from '@/pages/PropertyFormPage';
import ContractsPage from '@/pages/ContractsPage';
import ContractDetailPage from '@/pages/ContractDetailPage';
import ContractFormPage from '@/pages/ContractFormPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import ActivityDetailPage from '@/pages/ActivityDetailPage';
import ActivityFormPage from '@/pages/ActivityFormPage';
import DocumentsPage from '@/pages/DocumentsPage';
import DocumentFormPage from '@/pages/DocumentFormPage';
import UsersPage from '@/pages/users/UsersPage';
import UserDetailPage from '@/pages/users/UserDetailPage';
import UserInvitePage from '@/pages/users/UserInvitePage';
import FinancesPage from '@/pages/FinancesPage';
import FinanceDashboardPage from '@/pages/finances/FinanceDashboardPage';
import IncomePage from '@/pages/finances/IncomePage';
import ExpensesPage from '@/pages/finances/ExpensesPage';
import ReportsPage from '@/pages/finances/ReportsPage';
import DevelopmentsPage from '@/pages/DevelopmentsPage';
import DevelopmentFormPage from '@/pages/DevelopmentFormPage';
import NotFound from '@/pages/NotFound';

// Auth
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import AuthCallback from '@/pages/auth/AuthCallback';
import Unauthorized from '@/pages/Unauthorized';

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ClientsPage from '@/pages/admin/ClientsPage';
import ClientDetailPage from '@/pages/admin/ClientDetailPage';
import ClientFormPage from '@/pages/admin/ClientFormPage';
import SettingsPage from '@/pages/admin/SettingsPage';

import { AuthProvider } from '@/components/auth/auth-provider';
import { MapboxProvider } from '@/contexts/MapboxContext';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <MapboxProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                
                {/* Properties */}
                <Route path="/properties" element={<AppLayout><Properties /></AppLayout>} />
                <Route path="/properties/new" element={<AppLayout><PropertyFormPage /></AppLayout>} />
                <Route path="/properties/:id" element={<AppLayout><PropertyDetailPage /></AppLayout>} />
                <Route path="/properties/:id/edit" element={<AppLayout><PropertyFormPage /></AppLayout>} />

                {/* Developments */}
                <Route path="/developments" element={<AppLayout><DevelopmentsPage /></AppLayout>} />
                <Route path="/developments/new" element={<AppLayout><DevelopmentFormPage /></AppLayout>} />
                <Route path="/developments/:id/edit" element={<AppLayout><DevelopmentFormPage /></AppLayout>} />

                {/* Contracts */}
                <Route path="/contracts" element={<AppLayout><ContractsPage /></AppLayout>} />
                <Route path="/contracts/new" element={<AppLayout><ContractFormPage /></AppLayout>} />
                <Route path="/contracts/:id" element={<AppLayout><ContractDetailPage /></AppLayout>} />
                <Route path="/contracts/:id/edit" element={<AppLayout><ContractFormPage /></AppLayout>} />

                {/* Activities */}
                <Route path="/activities" element={<AppLayout><ActivitiesPage /></AppLayout>} />
                <Route path="/activities/new" element={<AppLayout><ActivityFormPage /></AppLayout>} />
                <Route path="/activities/:id" element={<AppLayout><ActivityDetailPage /></AppLayout>} />
                <Route path="/activities/:id/edit" element={<AppLayout><ActivityFormPage /></AppLayout>} />

                {/* Documents */}
                <Route path="/documents" element={<AppLayout><DocumentsPage /></AppLayout>} />
                <Route path="/documents/new" element={<AppLayout><DocumentFormPage /></AppLayout>} />

                {/* Users */}
                <Route path="/users" element={<AppLayout><UsersPage /></AppLayout>} />
                <Route path="/users/:id" element={<AppLayout><UserDetailPage /></AppLayout>} />
                <Route path="/users/invite" element={<AppLayout><UserInvitePage /></AppLayout>} />

                {/* Finances */}
                <Route path="/finances" element={<AppLayout><FinancesPage /></AppLayout>} />
                <Route path="/finances/dashboard" element={<AppLayout><FinanceDashboardPage /></AppLayout>} />
                <Route path="/finances/income" element={<AppLayout><IncomePage /></AppLayout>} />
                <Route path="/finances/expenses" element={<AppLayout><ExpensesPage /></AppLayout>} />
                <Route path="/finances/reports" element={<AppLayout><ReportsPage /></AppLayout>} />

                {/* Admin */}
                <Route path="/admin" element={<AppLayout><AdminDashboard /></AppLayout>} />
                <Route path="/admin/clients" element={<AppLayout><ClientsPage /></AppLayout>} />
                <Route path="/admin/clients/new" element={<AppLayout><ClientFormPage /></AppLayout>} />
                <Route path="/admin/clients/:id" element={<AppLayout><ClientDetailPage /></AppLayout>} />
                <Route path="/admin/clients/:id/edit" element={<AppLayout><ClientFormPage /></AppLayout>} />
                <Route path="/admin/settings" element={<AppLayout><SettingsPage /></AppLayout>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </MapboxProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
