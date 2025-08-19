import { useAuth } from '@/hooks/useAuth';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';

export function useUserRole() {
  // Tentar usar o auth otimizado primeiro, fallback para o padrão
  let authHook;
  try {
    authHook = useOptimizedAuth();
  } catch {
    authHook = useAuth();
  }
  
  const { profile, loading } = authHook;

  return {
    role: profile?.cargo || null,
    loading,
    isSuperAdmin: profile?.cargo === 'super_admin',
    isAdmin: profile?.cargo === 'admin' || profile?.cargo === 'super_admin'
  };
}