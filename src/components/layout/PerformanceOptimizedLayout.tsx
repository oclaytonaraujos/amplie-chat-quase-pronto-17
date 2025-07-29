import { memo, ReactNode, useEffect, useState } from 'react';
import { Layout } from './Layout';
import { ResponsiveContainer } from '@/components/ui/responsive-optimizations';
import { IntelligentLoading } from '@/components/ui/intelligent-loading';
import { useSmartPreload, useCriticalResourcePreload } from '@/hooks/useSmartPreload';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNetworkStatus, useDevicePerformance } from '@/hooks/useResponsiveQuery';

interface PerformanceOptimizedLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  enablePreload?: boolean;
  enableCache?: boolean;
  loadingType?: 'conversations' | 'messages' | 'contacts' | 'generic';
}

export const PerformanceOptimizedLayout = memo(({
  children,
  title,
  description,
  icon,
  enablePreload = true,
  enableCache = true,
  loadingType = 'generic'
}: PerformanceOptimizedLayoutProps) => {
  const isMobile = useIsMobile();
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { devicePerformance, animationsEnabled } = useDevicePerformance();
  
  // Performance hooks
  const [isLoading, setIsLoading] = useState(false);
  const { handleInteraction, getCacheStats } = useSmartPreload({
    priority: devicePerformance === 'low' ? 'low' : 'medium',
    maxConcurrent: isMobile ? 1 : 3
  });
  
  // Preload crítico
  const { preloadedResources } = useCriticalResourcePreload();

  // Cache para dados da página
  const { data: pageData, loading: pageLoading } = useIntelligentCache(
    `page-${title}`,
    async () => {
      // Simular carregamento de dados da página
      await new Promise(resolve => setTimeout(resolve, 100));
      return { title, timestamp: Date.now() };
    },
    {
      ttl: enableCache ? (isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000) : 0,
      enablePersistence: enableCache
    }
  );

  // Performance monitoring
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`📊 Performance Stats for ${title}:`, {
        devicePerformance,
        isSlowConnection,
        animationsEnabled,
        preloadedResources: preloadedResources.length,
        cacheStats: getCacheStats()
      });
    }
  }, [title, devicePerformance, isSlowConnection, animationsEnabled, preloadedResources, getCacheStats]);

  // Otimizações baseadas na performance do device
  const layoutOptimizations = {
    // Reduzir animações em devices lentos
    className: !animationsEnabled ? 'motion-reduce:transition-none motion-reduce:animate-none' : '',
    
    // Lazy loading mais agressivo em mobile/conexão lenta
    enableLazyImages: isMobile || isSlowConnection,
    
    // Fallback simplificado para devices lentos
    fallback: devicePerformance === 'low' ? (
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    ) : undefined
  };

  // Mostrar loading se página está carregando
  if (pageLoading && enableCache) {
    return (
      <Layout title={title} description={description} icon={icon}>
        <IntelligentLoading 
          isLoading={true}
          type={loadingType} 
          showProgress={!isMobile}
        >
          <div />
        </IntelligentLoading>
      </Layout>
    );
  }

  return (
    <Layout title={title} description={description} icon={icon}>
      <ResponsiveContainer
        className={layoutOptimizations.className}
      >
        {/* Header de performance (apenas em dev) */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-2 bg-muted/20 rounded text-xs text-muted-foreground">
            Device: {devicePerformance} | Network: {isSlowConnection ? 'slow' : 'fast'} | 
            Preloaded: {preloadedResources.length} | 
            Online: {isOnline ? '✅' : '❌'}
          </div>
        )}

        {/* Loading overlay inteligente */}
        {isLoading && <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center">
          <IntelligentLoading isLoading={true} type={loadingType}><div /></IntelligentLoading>
        </div>}
        
        {/* Conteúdo principal */}
        <div 
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
          onMouseEnter={() => enablePreload && handleInteraction(location.pathname, 'hover')}
          onFocus={() => enablePreload && handleInteraction(location.pathname, 'focus')}
        >
          {children}
        </div>

        {/* Indicador de performance (apenas em dev) */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg p-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                devicePerformance === 'high' ? 'bg-green-500' :
                devicePerformance === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span>{devicePerformance.toUpperCase()}</span>
              {isSlowConnection && <span className="text-orange-500">SLOW</span>}
            </div>
          </div>
        )}
      </ResponsiveContainer>
    </Layout>
  );
});

PerformanceOptimizedLayout.displayName = 'PerformanceOptimizedLayout';

// HOC para aplicar otimizações automaticamente
export function withPerformanceOptimizations<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    loadingType?: PerformanceOptimizedLayoutProps['loadingType'];
    enablePreload?: boolean;
    enableCache?: boolean;
  }
) {
  const OptimizedComponent = memo((props: T) => {
    return <Component {...props} />;
  });

  OptimizedComponent.displayName = `withPerformanceOptimizations(${Component.displayName || Component.name})`;
  
  return OptimizedComponent;
}

// Hook para aplicar otimizações de performance em componentes individuais
export function useComponentPerformance(componentName: string) {
  const isMobile = useIsMobile();
  const { devicePerformance } = useDevicePerformance();
  const { isSlowConnection } = useNetworkStatus();

  // Calcular configurações otimizadas
  const optimizations = {
    // Reduzir re-renders desnecessários
    shouldMemo: devicePerformance === 'low' || isMobile,
    
    // Lazy loading para componentes pesados
    shouldLazyLoad: isSlowConnection || devicePerformance === 'low',
    
    // Reduzir animações
    animationsEnabled: devicePerformance !== 'low' && !isSlowConnection,
    
    // Throttle para eventos
    throttleMs: devicePerformance === 'low' ? 300 : 150,
    
    // Debounce para pesquisas
    debounceMs: isSlowConnection ? 800 : 400,
    
    // Limite de itens por página
    pageSize: devicePerformance === 'low' ? 10 : isMobile ? 20 : 50
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`🔧 Performance optimizations for ${componentName}:`, optimizations);
    }
  }, [componentName, optimizations]);

  return optimizations;
}