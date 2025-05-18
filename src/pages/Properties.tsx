
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PropertyList } from '@/components/properties/property-list';
import { useProperties } from '@/hooks/use-properties';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function Properties() {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, isLoading, setSelectedPropertyId } = useProperties();
  const { user, session } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    console.log('Authentication state in Properties:', { 
      isAuthenticated: !!session, 
      user: user?.id,
      sessionExists: !!session
    });
    
    if (!session) {
      // Instead of redirecting, set an error message
      setErrorMessage('Sessão expirada ou usuário não autenticado');
    } else {
      // Clear error message if user is authenticated
      setErrorMessage(null);
    }
  }, [session, user, navigate]);

  // Check if we need to redirect to property details
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      // If there's an ID in the URL, redirect to the detail page
      navigate(`/properties/detail?id=${id}`, { replace: true });
    }
  }, [location.search, navigate]);

  // Add event listener to check API responses
  useEffect(() => {
    const fetchErrorHandler = (event) => {
      if (event.detail?.status === 401) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    window.addEventListener('fetch-error', fetchErrorHandler);
    return () => {
      window.removeEventListener('fetch-error', fetchErrorHandler);
    };
  }, [navigate]);

  // Log to debug properties state
  useEffect(() => {
    console.log('Properties data:', { 
      count: properties?.length || 0, 
      loading: isLoading,
      data: properties
    });
  }, [properties, isLoading]);

  const handleSelectProperty = (id: string) => {
    navigate(`/properties/detail?id=${id}`);
  };

  const handleAddNewProperty = () => {
    navigate('/properties/new');
  };

  // Show the property list
  return (
    <PropertyList
      properties={properties || []}
      isLoading={isLoading}
      onSelect={handleSelectProperty}
      onAddNew={handleAddNewProperty}
    />
  );
}
