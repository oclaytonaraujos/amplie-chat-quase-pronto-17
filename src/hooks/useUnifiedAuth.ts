import { useContext } from 'react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';

/**
 * Hook unificado que funciona com ambos os providers
 * Esta é uma solução transitória para evitar quebrar 60+ arquivos
 */
export function useUnifiedAuth() {
  try {
    // Tentar usar o provider otimizado primeiro
    return useOptimizedAuth();
  } catch (error) {
    // Se falhar, significa que não está dentro do provider
    console.error('useUnifiedAuth: OptimizedAuthProvider não encontrado', error);
    
    // Fallback para dados mockados em caso de erro crítico
    return {
      user: null,
      profile: null,
      session: null,
      loading: false,
      signIn: async () => ({ success: false, error: 'Provider não disponível' }),
      signOut: async () => {},
      updateProfile: async () => {},
      isAdmin: false,
      isSuperAdmin: false,
      isOfflineMode: true
    };
  }
}

// Re-export para compatibilidade
export { useUnifiedAuth as useAuth };