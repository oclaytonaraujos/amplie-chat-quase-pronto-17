/**
 * Hook para monitoramento de performance em tempo real
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useThrottle } from '@/hooks/usePerformanceOptimizations';

interface PerformanceMetrics {
  // Métricas de renderização
  renderTime: number;
  componentCount: number;
  reRenderCount: number;
  
  // Métricas de memória
  memoryUsage: number;
  memoryPeak: number;
  
  // Métricas de rede
  networkRequests: number;
  networkErrors: number;
  
  // Métricas de interação
  userInteractions: number;
  responseTime: number;
  
  // Timestamps
  firstRender: number;
  lastUpdate: number;
}

interface ComponentPerformanceData {
  name: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

export function usePerformanceMonitoring(componentName: string, enabled: boolean = import.meta.env.DEV) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    reRenderCount: 0,
    memoryUsage: 0,
    memoryPeak: 0,
    networkRequests: 0,
    networkErrors: 0,
    userInteractions: 0,
    responseTime: 0,
    firstRender: Date.now(),
    lastUpdate: Date.now()
  });

  const renderStartTime = useRef<number>(0);
  const componentRegistry = useRef<Map<string, ComponentPerformanceData>>(new Map());
  const interactionTimes = useRef<number[]>([]);
  const networkObserver = useRef<PerformanceObserver | null>(null);

  // Throttled metrics update para evitar overhead
  const throttledUpdateMetrics = useThrottle((newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics,
      lastUpdate: Date.now()
    }));
  }, 1000);

  // Medir tempo de render do componente
  const startRenderMeasure = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  const endRenderMeasure = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    
    // Atualizar registro do componente
    const current = componentRegistry.current.get(componentName) || {
      name: componentName,
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0
    };

    const updated: ComponentPerformanceData = {
      ...current,
      renderCount: current.renderCount + 1,
      totalRenderTime: current.totalRenderTime + renderTime,
      averageRenderTime: (current.totalRenderTime + renderTime) / (current.renderCount + 1),
      lastRenderTime: renderTime
    };

    componentRegistry.current.set(componentName, updated);

    throttledUpdateMetrics({
      renderTime,
      reRenderCount: metrics.reRenderCount + 1,
      componentCount: componentRegistry.current.size
    });

    renderStartTime.current = 0;
  }, [enabled, componentName, metrics.reRenderCount, throttledUpdateMetrics]);

  // Monitorar uso de memória
  const measureMemoryUsage = useCallback(() => {
    if (!enabled || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    const currentUsage = memory.usedJSHeapSize;
    
    throttledUpdateMetrics({
      memoryUsage: currentUsage,
      memoryPeak: Math.max(metrics.memoryPeak, currentUsage)
    });
  }, [enabled, metrics.memoryPeak, throttledUpdateMetrics]);

  // Registrar interação do usuário
  const recordUserInteraction = useCallback((responseTime?: number) => {
    if (!enabled) return;

    const now = Date.now();
    if (responseTime) {
      interactionTimes.current.push(responseTime);
      // Manter apenas os últimos 10 tempos
      if (interactionTimes.current.length > 10) {
        interactionTimes.current.shift();
      }
    }

    const averageResponseTime = interactionTimes.current.length > 0
      ? interactionTimes.current.reduce((a, b) => a + b, 0) / interactionTimes.current.length
      : 0;

    throttledUpdateMetrics({
      userInteractions: metrics.userInteractions + 1,
      responseTime: averageResponseTime
    });
  }, [enabled, metrics.userInteractions, throttledUpdateMetrics]);

  // Performance Observer para requisições de rede
  useEffect(() => {
    if (!enabled || !window.PerformanceObserver) return;

    networkObserver.current = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let requests = 0;
      let errors = 0;

      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          requests++;
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize > 0) {
            errors++;
          }
        }
      });

      if (requests > 0) {
        throttledUpdateMetrics({
          networkRequests: metrics.networkRequests + requests,
          networkErrors: metrics.networkErrors + errors
        });
      }
    });

    try {
      networkObserver.current.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance monitoring não suportado:', error);
    }

    return () => {
      networkObserver.current?.disconnect();
    };
  }, [enabled, metrics.networkRequests, metrics.networkErrors, throttledUpdateMetrics]);

  // Monitoramento automático de memória
  useEffect(() => {
    if (!enabled) return;

    const memoryInterval = setInterval(measureMemoryUsage, 5000);
    return () => clearInterval(memoryInterval);
  }, [enabled, measureMemoryUsage]);

  // Análise de performance e relatórios
  const getPerformanceReport = useCallback(() => {
    const components = Array.from(componentRegistry.current.values());
    const slowComponents = components.filter(c => c.averageRenderTime > 16); // > 16ms
    const totalRenderTime = components.reduce((sum, c) => sum + c.totalRenderTime, 0);

    return {
      summary: {
        totalComponents: components.length,
        slowComponents: slowComponents.length,
        totalRenderTime,
        averageMemoryUsage: metrics.memoryUsage,
        networkEfficiency: metrics.networkRequests > 0 
          ? (1 - (metrics.networkErrors / metrics.networkRequests)) * 100 
          : 100
      },
      details: {
        components,
        slowComponents,
        metrics,
        recommendations: generateRecommendations(metrics, components)
      }
    };
  }, [metrics]);

  // Gerar recomendações baseadas nas métricas
  const generateRecommendations = (metrics: PerformanceMetrics, components: ComponentPerformanceData[]) => {
    const recommendations: string[] = [];

    if (metrics.memoryUsage > 50 * 1024 * 1024) { // > 50MB
      recommendations.push('Alto uso de memória detectado. Considere lazy loading ou limpeza de cache.');
    }

    if (metrics.responseTime > 100) {
      recommendations.push('Tempo de resposta alto. Considere debounce ou throttling em interações.');
    }

    if (metrics.networkErrors / metrics.networkRequests > 0.1) {
      recommendations.push('Alta taxa de erros de rede. Implemente retry logic.');
    }

    const slowComponents = components.filter(c => c.averageRenderTime > 16);
    if (slowComponents.length > 0) {
      recommendations.push(`Componentes lentos detectados: ${slowComponents.map(c => c.name).join(', ')}`);
    }

    return recommendations;
  };

  // Hook para componentes filhos usarem as medições
  const useRenderMeasurement = () => {
    useEffect(() => {
      startRenderMeasure();
      return endRenderMeasure;
    });
  };

  // Limpeza de dados antigos
  const clearOldData = useCallback(() => {
    componentRegistry.current.clear();
    interactionTimes.current = [];
    setMetrics(prev => ({
      ...prev,
      reRenderCount: 0,
      userInteractions: 0,
      networkRequests: 0,
      networkErrors: 0,
      firstRender: Date.now()
    }));
  }, []);

  return {
    metrics,
    startRenderMeasure,
    endRenderMeasure,
    measureMemoryUsage,
    recordUserInteraction,
    getPerformanceReport,
    useRenderMeasurement,
    clearOldData,
    isEnabled: enabled
  };
}

// Hook específico para monitoramento de lista/scroll
export function useScrollPerformanceMonitoring(listName: string) {
  const scrollMetrics = useRef({
    scrollEvents: 0,
    scrollDistance: 0,
    scrollSpeed: 0,
    lastScrollTime: 0,
    lastScrollTop: 0
  });

  const recordScrollEvent = useCallback((scrollTop: number) => {
    const now = performance.now();
    const distance = Math.abs(scrollTop - scrollMetrics.current.lastScrollTop);
    const timeDiff = now - scrollMetrics.current.lastScrollTime;
    const speed = timeDiff > 0 ? distance / timeDiff : 0;

    scrollMetrics.current = {
      scrollEvents: scrollMetrics.current.scrollEvents + 1,
      scrollDistance: scrollMetrics.current.scrollDistance + distance,
      scrollSpeed: speed,
      lastScrollTime: now,
      lastScrollTop: scrollTop
    };

    // Log métricas se scroll muito rápido ou muitos eventos
    if (scrollMetrics.current.scrollEvents % 100 === 0 || speed > 5) {
      console.log(`📊 Scroll metrics for ${listName}:`, {
        events: scrollMetrics.current.scrollEvents,
        totalDistance: scrollMetrics.current.scrollDistance,
        currentSpeed: speed.toFixed(2),
        avgEventsPerSecond: scrollMetrics.current.scrollEvents / ((now - scrollMetrics.current.lastScrollTime + 1000) / 1000)
      });
    }
  }, [listName]);

  return {
    recordScrollEvent,
    getScrollMetrics: () => scrollMetrics.current
  };
}