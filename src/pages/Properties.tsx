
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PropertyList } from '@/components/properties/property-list';
import { useProperties } from '@/hooks/use-properties';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/utils/auth-cleanup';

export default function Properties() {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, isLoading, setSelectedPropertyId } = useProperties();
  const { user, session } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authCheckedRef = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    console.log('Authentication state in Properties:', { 
      isAuthenticated: !!session, 
      user: user?.id,
      sessionExists: !!session,
      tokenExpiry: session ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
      tokenExpired: session ? new Date(session.expires_at * 1000) < new Date() : false
    });
    
    if (!session) {
      setErrorMessage('Sessão expirada ou usuário não autenticado');
      
      // Verificar se a sessão está inválida/expirada
      if (!isRedirecting && !authCheckedRef.current) {
        setIsRedirecting(true);
        console.log('No active session, redirecting to login');
        
        // Limpar estado de autenticação
        cleanupAuthState();
        
        // Redirecionar para login usando reload da página para limpar estado
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else {
      // Verificar se o token está expirado
      const tokenExpiry = session ? new Date(session.expires_at * 1000) : null;
      const isExpired = tokenExpiry ? tokenExpiry < new Date() : false;
      
      if (isExpired && !isRedirecting) {
        console.log('Token expired, redirecting to login', tokenExpiry);
        setIsRedirecting(true);
        cleanupAuthState();
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        // Sessão válida, limpar erro
        setErrorMessage(null);
        authCheckedRef.current = true;
      }
    }
  }, [session, user, navigate, isRedirecting]);

  // Check if we need to redirect to property details
  useEffect(() => {
    if (authCheckedRef.current && !isRedirecting) {
      const params = new URLSearchParams(location.search);
      const id = params.get('id');
      
      if (id) {
        // If there's an ID in the URL, redirect to the detail page
        navigate(`/properties/detail?id=${id}`, { replace: true });
      }
    }
  }, [location.search, navigate, isRedirecting]);

  // Add event listener to check API responses
  useEffect(() => {
    const fetchErrorHandler = (event) => {
      if (event.detail?.status === 401) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        
        if (!isRedirecting) {
          setIsRedirecting(true);
          // Limpar estado de autenticação
          cleanupAuthState();
          
          // Redirecionar para login após um breve atraso
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        }
      }
    };

    window.addEventListener('fetch-error', fetchErrorHandler);
    return () => {
      window.removeEventListener('fetch-error', fetchErrorHandler);
    };
  }, [navigate, isRedirecting]);

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

  // Mostrar uma mensagem de redirecionamento se estiver em processo de redirecionamento
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Redirecionando para a página de login...</p>
      </div>
    );
  }

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
