/**
 * Hook para detectar status de conectividade real do sistema
 */
import { useState, useEffect, useCallback } from 'react';

interface ConnectivityStatus {
  isOnline: boolean;
  isSystemOnline: boolean;
  lastCheck: Date;
  checkConnectivity: () => Promise<boolean>;
}

export function useConnectivity(): ConnectivityStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSystemOnline, setIsSystemOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());

  // Verificar conectividade real com o sistema
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Tentar acessar o manifest do próprio sistema
      const response = await fetch('/manifest.json', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'cors'
      });
      
      const systemOnline = response.ok;
      setIsSystemOnline(systemOnline);
      setLastCheck(new Date());
      
      return systemOnline && navigator.onLine;
    } catch (error) {
      console.warn('Falha na verificação de conectividade:', error);
      setIsSystemOnline(false);
      setLastCheck(new Date());
      return false;
    }
  }, []);

  // Monitorar eventos de conectividade do navegador
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Verificar conectividade real quando volta online
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSystemOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificação inicial
    checkConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity]);

  // Verificação periódica (a cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, [checkConnectivity]);

  return {
    isOnline: isOnline && isSystemOnline,
    isSystemOnline,
    lastCheck,
    checkConnectivity
  };
}