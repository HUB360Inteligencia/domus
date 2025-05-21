
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Home from './pages/Index';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Properties from './pages/Properties';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyFormPage from './pages/PropertyFormPage';
import ClientsPage from './pages/admin/ClientsPage';
import ContractsPage from './pages/ContractsPage';
import { AppLayout } from './components/layout/app-layout';
import { AdminLayout } from './components/layout/admin-layout';
import Dashboard from './pages/Dashboard';
import { RequireAuth } from './components/auth/require-auth';
import { RequireAdmin } from './components/auth/require-admin';
import ActivitiesPage from './pages/ActivitiesPage';
import { Toaster } from "@/components/ui/toaster"
import AdminDashboard from './pages/admin/AdminDashboard';

// Use React.lazy outside of JSX
const ClientDetailPage = React.lazy(() => import('./pages/admin/ClientDetailPage'));
const ClientFormPage = React.lazy(() => import('./pages/admin/ClientFormPage'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createRouter()} />
      <Toaster />
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient()

function createRouter() {
  return createBrowserRouter([
    {
      path: "/",
      element: <AppLayout />,
      children: [
        {
          path: '/',
          element: <RequireAuth><Dashboard /></RequireAuth>
        },
        {
          path: '/properties',
          element: <RequireAuth><Properties /></RequireAuth>
        },
        {
          path: '/properties/:id',
          element: <RequireAuth><PropertyDetailPage /></RequireAuth>
        },
        {
          path: '/properties/edit',
          element: <RequireAuth><PropertyFormPage /></RequireAuth>
        },
        {
          path: '/clients',
          element: <RequireAuth><ClientsPage /></RequireAuth>
        },
        {
          path: '/contracts',
          element: <RequireAuth><ContractsPage /></RequireAuth>
        },
        {
          path: '/activities',
          element: <ActivitiesPage />
        },
      ],
    },
    {
      path: "/admin",
      element: <RequireAdmin><AdminLayout /></RequireAdmin>,
      children: [
        {
          path: "",  // Changed from "/" to "" to make it a relative path
          element: <AdminDashboard />  // Changed to use AdminDashboard instead of Home
        },
        {
          path: "clients",
          element: <ClientsPage />
        },
        {
          path: "clients/:clientId",
          element: <ClientDetailPage />
        },
        {
          path: "clients/new",
          element: <ClientFormPage />
        },
        {
          path: "clients/edit/:clientId",
          element: <ClientFormPage />
        }
      ]
    },
    {
      path: '/signin',
      element: <Login />
    },
    {
      path: '/signup',
      element: <Register />
    }
  ]);
}

export default App;
