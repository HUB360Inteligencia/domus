
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/app-layout";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthCallback from "./pages/auth/AuthCallback";
import Unauthorized from "./pages/Unauthorized";
import { AuthProvider } from "./components/auth/auth-provider";
import { ProtectedRoute } from "./components/auth/protected-route";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rotas de autenticação */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Rotas protegidas dentro do layout */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/contracts" element={<Dashboard />} />
              <Route path="/documents" element={<Dashboard />} />
              <Route path="/finances" element={<Dashboard />} />
              
              {/* Rotas com permissões específicas */}
              <Route path="/users" element={
                <ProtectedRoute requiredPermission="users.view">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/ai-assistant" element={<Dashboard />} />
              <Route path="/settings" element={
                <ProtectedRoute requiredPermission="settings.view">
                  <Dashboard />
                </ProtectedRoute>
              } />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
