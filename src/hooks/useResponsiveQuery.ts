/**
 * Hook para queries responsivas baseadas no tamanho da tela
 */
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveQueryOptions {
  mobile: {
    limit?: number;
    refetchInterval?: number;
    enabled?: boolean;
  };
  desktop: {
    limit?: number;
    refetchInterval?: number;
    enabled?: boolean;
  };
}

export function useResponsiveQuery(options: ResponsiveQueryOptions) {
  const isMobile = useIsMobile();
  const [currentOptions, setCurrentOptions] = useState(
    isMobile ? options.mobile : options.desktop
  );

  useEffect(() => {
    setCurrentOptions(isMobile ? options.mobile : options.desktop);
  }, [isMobile, options]);

  return {
    ...currentOptions,
    isMobile,
    // Configurações otimizadas para mobile
    staleTime: isMobile ? 30000 : 60000, // Cache mais curto no mobile
    gcTime: isMobile ? 5 * 60 * 1000 : 10 * 60 * 1000, // Garbage collection mais agressiva
    retry: isMobile ? 2 : 3, // Menos tentativas no mobile
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  };
}

// Hook para detectar conexão de rede
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar tipo de conexão (experimental)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection?.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection?.effectiveType || 'unknown');
      };
      
      connection?.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection?.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlowConnection: ['slow-2g', '2g'].includes(connectionType),
    isFastConnection: ['4g'].includes(connectionType),
  };
}

// Hook para otimizações baseadas na performance do dispositivo
export function useDevicePerformance() {
  const [devicePerformance, setDevicePerformance] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    // Estimativa baseada em hardware cores
    const cores = navigator.hardwareConcurrency || 2;
    
    // Estimativa baseada em memória (experimental)
    const memory = (navigator as any).deviceMemory;
    
    // Performance baseada em cores e memória
    let performance: 'low' | 'medium' | 'high' = 'medium';
    
    if (cores <= 2 || (memory && memory <= 2)) {
      performance = 'low';
    } else if (cores >= 8 || (memory && memory >= 8)) {
      performance = 'high';
    }
    
    setDevicePerformance(performance);
  }, []);

  return {
    devicePerformance,
    // Configurações baseadas na performance
    animationsEnabled: devicePerformance !== 'low',
    maxConcurrentRequests: devicePerformance === 'low' ? 2 : devicePerformance === 'medium' ? 4 : 6,
    cacheSize: devicePerformance === 'low' ? 50 : devicePerformance === 'medium' ? 100 : 200,
  };
}