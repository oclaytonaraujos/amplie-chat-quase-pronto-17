
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Log temporário para diagnóstico
  console.log('[ProtectedRoute] Estado atual:', { 
    loading, 
    hasUser: !!user, 
    userEmail: user?.email,
    currentPath: location.pathname,
    timestamp: new Date().toISOString()
  });

  if (loading) {
    console.log('[ProtectedRoute] Mostrando tela de carregamento...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
          <p className="text-xs text-muted-foreground mt-2">Path: {location.pathname}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] Usuário autenticado, renderizando conteúdo protegido');
  return <>{children}</>;
};
