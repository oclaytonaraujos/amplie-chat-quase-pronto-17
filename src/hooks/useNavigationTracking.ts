
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export function useNavigationTracking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const { getFirstAvailableRoute, loading: permissionsLoading } = useUserPermissions();

  useEffect(() => {
    // Aguardar carregamento completo antes de tomar decisões de navegação
    if (authLoading || roleLoading || permissionsLoading) {
      return;
    }

    // Redirecionar usuários não autenticados para páginas protegidas
    if (!user && !['/', '/auth'].includes(location.pathname)) {
      navigate('/auth', { replace: true });
      return;
    }

    // Redirecionar usuários autenticados da página de auth
    if (user && location.pathname === '/auth') {
      const firstRoute = getFirstAvailableRoute();
      navigate(firstRoute, { replace: true });
      return;
    }

    // Verificar acesso à página de super admin
    if (location.pathname === '/admin') {
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }
      
      if (!isSuperAdmin) {
        const firstRoute = getFirstAvailableRoute();
        navigate(firstRoute, { replace: true });
        return;
      }
    }

    // Redirecionar página inicial para primeira rota disponível
    if (location.pathname === '/' && user) {
      const firstRoute = getFirstAvailableRoute();
      navigate(firstRoute, { replace: true });
      return;
    }
  }, [location.pathname, user, isSuperAdmin, authLoading, roleLoading, permissionsLoading, navigate, getFirstAvailableRoute]);

  return {
    currentPath: location.pathname,
    canAccessSuperAdmin: isSuperAdmin,
    isAuthenticated: !!user
  };
}
