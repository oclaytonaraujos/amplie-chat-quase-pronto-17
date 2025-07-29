import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/structured-logger';
import { useErrorHandler } from '@/utils/error-handler';

interface SystemAlert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: any;
}

interface SystemMetrics {
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  dbConnections: number;
}

export function useSystemMonitoring() {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const checkSystemHealth = useCallback(async () => {
    try {
      const startTime = performance.now();
      
      // Verificar saúde do sistema
      const { data: healthCheck } = await supabase.functions.invoke('system-health-check');
      const responseTime = performance.now() - startTime;

      const newMetrics: SystemMetrics = {
        responseTime,
        errorRate: healthCheck?.errorRate || 0,
        activeUsers: healthCheck?.activeUsers || 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
        cpuUsage: healthCheck?.cpuUsage || 0,
        dbConnections: healthCheck?.dbConnections || 0
      };

      setMetrics(newMetrics);

      // Gerar alertas baseados nas métricas
      await generateAlerts(newMetrics);

      logger.info('System health check completed', {
        component: 'SystemMonitoring',
        metadata: newMetrics
      });

    } catch (error) {
      handleError(error as Error, {
        action: 'checkSystemHealth',
        additionalContext: { context: 'SystemMonitoring.checkSystemHealth' }
      });
    }
  }, []);

  const generateAlerts = useCallback(async (metrics: SystemMetrics) => {
    const newAlerts: SystemAlert[] = [];

    // Alert de performance
    if (metrics.responseTime > 2000) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'performance',
        severity: metrics.responseTime > 5000 ? 'critical' : 'high',
        message: `High response time detected: ${Math.round(metrics.responseTime)}ms`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metadata: { responseTime: metrics.responseTime }
      });
    }

    // Alert de erro
    if (metrics.errorRate > 5) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'error',
        severity: metrics.errorRate > 15 ? 'critical' : 'high',
        message: `High error rate detected: ${metrics.errorRate}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metadata: { errorRate: metrics.errorRate }
      });
    }

    // Alert de memória
    if (metrics.memoryUsage > 100) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'capacity',
        severity: metrics.memoryUsage > 200 ? 'critical' : 'medium',
        message: `High memory usage: ${Math.round(metrics.memoryUsage)}MB`,
        timestamp: new Date().toISOString(),
        resolved: false,
        metadata: { memoryUsage: metrics.memoryUsage }
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 19)]); // Manter apenas 20 alertas

      // Enviar alertas críticos para logs
      newAlerts.forEach(alert => {
        if (alert.severity === 'critical') {
          logger.critical(`System Alert: ${alert.message}`, {
            component: 'SystemMonitoring',
            metadata: alert
          });
        }
      });
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );

    logger.info('Alert resolved', {
      component: 'SystemMonitoring',
      metadata: { alertId }
    });
  }, []);

  const clearResolvedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.resolved));
  }, []);

  const startMonitoring = useCallback(() => {
    if (!user || isMonitoring) return;

    setIsMonitoring(true);
    
    // Verificação inicial
    checkSystemHealth();

    // Verificações periódicas
    const interval = setInterval(checkSystemHealth, 30000); // A cada 30 segundos

    logger.info('System monitoring started', {
      component: 'SystemMonitoring',
      userId: user.id
    });

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
      logger.info('System monitoring stopped', {
        component: 'SystemMonitoring'
      });
    };
  }, [user, isMonitoring, checkSystemHealth]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    if (user) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [user, startMonitoring]);

  return {
    alerts,
    metrics,
    isMonitoring,
    resolveAlert,
    clearResolvedAlerts,
    checkSystemHealth,
    startMonitoring,
    stopMonitoring
  };
}