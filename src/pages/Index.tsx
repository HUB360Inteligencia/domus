
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

// Redirect to the dashboard if logged in, or to login page if not
const Index = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default Index;
