
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Home from './pages/Index';
import { SignIn } from './pages/auth/Login';
import { SignUp } from './pages/auth/Register';
import { PropertiesPage } from './pages/Properties';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyFormPage from './pages/PropertyFormPage';
import ClientsPage from './pages/admin/ClientsPage';
import ContractsPage from './pages/ContractsPage';
import { AppLayout } from './components/layout/app-layout';
import { AdminLayout } from './components/layout/admin-layout';
import SettingsPage from './pages/SettingsPage';
import { RequireAuth } from './components/auth/require-auth';
import { RequireAdmin } from './components/auth/require-admin';
import Dashboard from './pages/Dashboard';
import { Toaster } from "@/components/ui/toaster"
import ActivitiesPage from './pages/ActivitiesPage';

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
          element: <RequireAuth><PropertiesPage /></RequireAuth>
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
          path: '/settings',
          element: <RequireAuth><SettingsPage /></RequireAuth>
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
          path: '/',
          element: <Home />
        },
      ]
    },
    {
      path: '/signin',
      element: <SignIn />
    },
    {
      path: '/signup',
      element: <SignUp />
    }
  ]);
}

export default App;
