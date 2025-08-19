
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { SyncLoaderSection } from '@/components/ui/sync-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const authHook = useOptimizedAuth();
  
  const { user, loading, isOfflineMode } = authHook;
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SyncLoaderSection text="Verificando acesso..." />
      </div>
    );
  }

  // Em modo offline, permitir acesso sem autenticação no desenvolvimento
  if (!user && !isOfflineMode) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
