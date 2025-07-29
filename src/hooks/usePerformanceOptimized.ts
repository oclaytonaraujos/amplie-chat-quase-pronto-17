/**
 * Hook otimizado para melhorar performance de carregamento - INTEGRADO
 */
import { useEffect, useState, useCallback } from 'react';
import { useIntelligentPreload, preloadConfigs } from '@/utils/intelligent-preload';
import { useBundleAnalyzer } from '@/utils/bundle-analyzer';

// Preload crítico de recursos com sistema inteligente
export const usePerformanceOptimizations = () => {
  const [isReady, setIsReady] = useState(false);
  const { preload, recordUsage } = useIntelligentPreload();
  const { recordUsage: recordBundleUsage } = useBundleAnalyzer();

  useEffect(() => {
    // Preload de recursos críticos usando sistema inteligente
    const preloadCriticalResources = async () => {
      try {
        // Registrar e precarregar componentes críticos
        const criticalComponents = [
          { name: 'Button', loader: () => import('@/components/ui/button') },
          { name: 'Card', loader: () => import('@/components/ui/card') },
          { name: 'Input', loader: () => import('@/components/ui/input') },
          { name: 'Dialog', loader: () => import('@/components/ui/dialog') },
          { name: 'Toast', loader: () => import('@/components/ui/toast') }
        ];

        // Registrar todos os componentes críticos
        criticalComponents.forEach(({ name, loader }) => {
          preload(name, loader, preloadConfigs.criticalRoute);
          recordBundleUsage(name);
        });

        setIsReady(true);
      } catch (error) {
        console.warn('Failed to preload resources:', error);
        setIsReady(true); // Continue mesmo com erro
      }
    };

    preloadCriticalResources();
  }, [preload, recordBundleUsage]);

  const registerComponentUsage = useCallback((componentName: string, route?: string) => {
    recordUsage(route || window.location.pathname, componentName);
    recordBundleUsage(componentName);
  }, [recordUsage, recordBundleUsage]);

  return { 
    isReady,
    registerComponentUsage
  };
};

// Cache simples para componentes
const componentCache = new Map();

// Hook para cache de componentes lazy
export const useLazyComponentCache = () => {
  const getCachedComponent = useCallback((key: string, loader: () => Promise<any>) => {
    if (componentCache.has(key)) {
      return componentCache.get(key);
    }

    const component = loader();
    componentCache.set(key, component);
    return component;
  }, []);

  return { getCachedComponent };
};

// Performance monitoring simplificado
export const usePagePerformance = () => {
  useEffect(() => {
    const measurePageLoad = () => {
      if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
        
        if (loadTime > 3000) {
          console.warn(`Slow page load detected: ${Math.round(loadTime)}ms`);
        }
      }
    };

    // Medir após o carregamento completo
    window.addEventListener('load', measurePageLoad);
    
    return () => {
      window.removeEventListener('load', measurePageLoad);
    };
  }, []);
};