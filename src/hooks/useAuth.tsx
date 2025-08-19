
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';

/**
 * Hook de autenticação unificado e otimizado
 */
export function useAuth() {
  return useOptimizedAuth();
}

// Re-export do provider
export { OptimizedAuthProvider as AuthProvider } from '@/contexts/OptimizedAuthProvider';
