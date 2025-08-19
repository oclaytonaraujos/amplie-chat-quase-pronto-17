
// Hook unificado que funciona com qualquer provider
export { useUnifiedAuth as useAuth } from './useUnifiedAuth';

// Re-export do provider para compatibilidade
export { OptimizedAuthProvider as AuthProvider } from '@/contexts/OptimizedAuthProvider';
