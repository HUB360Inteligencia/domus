
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

// Redirect to the dashboard if logged in, or to login page if not
const Index = () => {
  // Safely access auth context
  const auth = useAuth();
  
  // If still loading auth state, don't redirect yet
  if (auth.isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  // Once loaded, redirect based on auth state
  return auth.user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;
