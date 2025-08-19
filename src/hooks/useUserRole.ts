import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';

export function useUserRole() {
  // Tentar usar o auth otimizado primeiro, fallback para o padrão
  const authHook = useOptimizedAuth();
  
  const { profile, loading } = authHook;

  return {
    role: profile?.cargo || null,
    loading,
    isSuperAdmin: profile?.cargo === 'super_admin',
    isAdmin: profile?.cargo === 'admin' || profile?.cargo === 'super_admin'
  };
}