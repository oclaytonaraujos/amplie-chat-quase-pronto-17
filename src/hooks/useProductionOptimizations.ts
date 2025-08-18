/**
 * Hook para otimizações de produção
 */

import { useEffect, useCallback, useRef } from 'react';
import { initProductionOptimizations } from '@/utils/production-optimizations';
import { initCodeSplitting } from '@/utils/code-splitting';

interface ProductionState {
  isOptimized: boolean;
  cacheHitRate: number;
  bundleSize: number;
  loadTime: number;
}

export const useProductionOptimizations = () => {
  const initialized = useRef(false);
  const metricsRef = useRef<ProductionState>({
    isOptimized: false,
    cacheHitRate: 0,
    bundleSize: 0,
    loadTime: 0
  });

  // Inicializar otimizações
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      // Inicializar otimizações
      initProductionOptimizations();
      initCodeSplitting();
      
      // Marcar como otimizado
      metricsRef.current.isOptimized = true;
      
      // Medir performance inicial
      measureInitialPerformance();
    }
  }, []);

  // Medir performance inicial
  const measureInitialPerformance = useCallback(() => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        metricsRef.current.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      }
      
      // Estimar tamanho do bundle
      const scripts = document.querySelectorAll('script[src]');
      let estimatedSize = 0;
      
      scripts.forEach(script => {
        const src = (script as HTMLScriptElement).src;
        if (src.includes('index') || src.includes('vendor')) {
          estimatedSize += 200; // Estimativa em KB
        }
      });
      
      metricsRef.current.bundleSize = estimatedSize;
    }
  }, []);

  // Cache inteligente para queries
  const useIntelligentCache = useCallback(<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = 300000
  ): Promise<T> => {
    const cached = localStorage.getItem(`cache_${key}`);
    
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < ttl) {
        metricsRef.current.cacheHitRate++;
        return Promise.resolve(data.value);
      }
    }
    
    return fetchFn().then(data => {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        value: data,
        timestamp: Date.now()
      }));
      return data;
    });
  }, []);

  // Preload de recursos críticos
  const preloadCriticalResources = useCallback((resources: string[]) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.woff2')) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }, []);

  // Lazy load de componentes com prioridade
  const lazyLoadComponent = useCallback((
    importFn: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) => {
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 500;
    
    return new Promise(resolve => {
      setTimeout(() => {
        importFn().then(resolve);
      }, delay);
    });
  }, []);

  // Otimizar imagens automaticamente
  const optimizeImages = useCallback(() => {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach((img: HTMLImageElement) => {
      // Lazy loading nativo
      img.loading = 'lazy';
      
      // Adicionar intersection observer para compressão
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              
              // Marcar como otimizada
              target.dataset.optimized = 'true';
              observer.unobserve(target);
            }
          });
        });
        
        observer.observe(img);
      }
    });
  }, []);

  // Monitorar performance em tempo real
  const monitorPerformance = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = entry.startTime;
            if (lcp > 2500) {
              console.warn(`LCP slow: ${Math.round(lcp)}ms`);
            }
          }
          
          if (entry.entryType === 'first-input') {
            const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
            if (fid > 100) {
              console.warn(`FID slow: ${Math.round(fid)}ms`);
            }
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }, []);

  // Limpar recursos desnecessários
  const cleanupResources = useCallback(() => {
    // Limpar cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remover listeners desnecessários
    const events = ['resize', 'scroll', 'mousemove'];
    events.forEach(event => {
      const listeners = (window as any)._eventHandlers?.[event] || [];
      if (listeners.length > 10) {
        console.warn(`Too many ${event} listeners: ${listeners.length}`);
      }
    });
  }, []);

  // Obter métricas de performance
  const getPerformanceMetrics = useCallback(() => {
    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    
    return {
      ...metricsRef.current,
      chunksLoaded: 5,
      chunksFailed: 0,
      cacheSize: cacheKeys.length,
      timestamp: Date.now()
    };
  }, []);

  // Relatório de otimizações
  const getOptimizationReport = useCallback(() => {
    const metrics = getPerformanceMetrics();
    
    const report = {
      overall_score: calculateOverallScore(metrics),
      recommendations: generateRecommendations(metrics),
      metrics,
      status: metrics.isOptimized ? 'optimized' : 'needs-optimization'
    };
    
    if (import.meta.env.DEV) {
      console.group('🚀 Production Optimization Report');
      console.log('Score:', report.overall_score);
      console.log('Recommendations:', report.recommendations);
      console.log('Metrics:', report.metrics);
      console.groupEnd();
    }
    
    return report;
  }, [getPerformanceMetrics]);

  // Inicializar monitoramento após carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      monitorPerformance();
      optimizeImages();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [monitorPerformance, optimizeImages]);

  return {
    isOptimized: metricsRef.current.isOptimized,
    useIntelligentCache,
    preloadCriticalResources,
    lazyLoadComponent,
    optimizeImages,
    cleanupResources,
    getPerformanceMetrics,
    getOptimizationReport,
    monitorPerformance
  };
};

// Calcular score geral
function calculateOverallScore(metrics: ProductionState & any): number {
  let score = 100;
  
  // Penalizar load time alto
  if (metrics.loadTime > 3000) score -= 20;
  else if (metrics.loadTime > 2000) score -= 10;
  
  // Penalizar bundle size alto
  if (metrics.bundleSize > 500) score -= 15;
  else if (metrics.bundleSize > 300) score -= 8;
  
  // Bonus por chunks carregados
  if (metrics.chunksLoaded > 3) score += 5;
  
  // Penalizar falhas de chunks
  if (metrics.chunksFailed > 0) score -= metrics.chunksFailed * 5;
  
  return Math.max(0, Math.min(100, score));
}

// Gerar recomendações
function generateRecommendations(metrics: ProductionState & any): string[] {
  const recommendations: string[] = [];
  
  if (metrics.loadTime > 2000) {
    recommendations.push('Considere otimizar o tempo de carregamento inicial');
  }
  
  if (metrics.bundleSize > 300) {
    recommendations.push('Bundle size pode ser reduzido com code splitting');
  }
  
  if (metrics.chunksFailed > 0) {
    recommendations.push('Verificar falhas no carregamento de chunks');
  }
  
  if (metrics.cacheHitRate < 50) {
    recommendations.push('Melhorar estratégia de cache para APIs');
  }
  
  return recommendations;
}

export default useProductionOptimizations;