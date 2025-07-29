/**
 * Hook para monitoramento de performance integrado com logs estruturado
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/structured-logger';

interface PerformanceMetric {
  endpoint: string;
  duration: number;
  status: number;
  metadata?: any;
}

export function usePerformanceMonitor() {
  const logMetric = useCallback(async (metric: PerformanceMetric) => {
    try {
      // Log local primeiro
      logger.performanceMetric(metric.endpoint, metric.duration, {
        metadata: {
          status: metric.status,
          userAgent: navigator.userAgent,
          ...metric.metadata
        }
      });

      // Enviar para função do Supabase
      await supabase.functions.invoke('performance-monitor', {
        body: {
          ...metric,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.warn('Erro ao registrar métrica de performance', {
        component: 'PerformanceMonitor',
        metadata: { endpoint: metric.endpoint }
      }, error as Error);
    }
  }, []);

  const measureAsync = useCallback(async <T>(
    endpoint: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    let status = 200;
    
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      status = 500;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      logMetric({ endpoint, duration, status });
    }
  }, [logMetric]);

  const getPerformanceReport = useCallback(async (period: '1h' | '24h' | '7d' = '24h') => {
    try {
      const { data } = await supabase.functions.invoke('performance-monitor', {
        method: 'GET',
        body: null
      });
      return data;
    } catch (error) {
      console.error('Erro ao obter relatório:', error);
      return null;
    }
  }, []);

  return {
    logMetric,
    measureAsync,
    getPerformanceReport
  };
}