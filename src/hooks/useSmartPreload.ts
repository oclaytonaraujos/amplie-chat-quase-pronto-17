import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNetworkStatus } from '@/hooks/useResponsiveQuery';

// Cache para componentes precarregados
const preloadCache = new Map<string, Promise<any>>();
const routeAccessHistory = new Map<string, number>();

// Definir rotas e suas dependências
const routeDependencies: Record<string, string[]> = {
  '/': ['/dashboard', '/atendimento'],
  '/dashboard': ['/atendimento', '/contatos', '/analytics'],
  '/atendimento': ['/contatos', '/chat-interno', '/kanban'],
  '/contatos': ['/atendimento', '/usuarios'],
  '/kanban': ['/atendimento', '/analytics'],
  '/chatbot': ['/automation-builder', '/templates'],
  '/analytics': ['/dashboard', '/system-monitor'],
  '/usuarios': ['/setores', '/gerenciar-equipe'],
  '/setores': ['/usuarios'],
  '/templates': ['/chatbot', '/automation-builder'],
  '/automation-builder': ['/templates', '/webhooks'],
  '/system-monitor': ['/analytics', '/webhooks'],
  '/webhooks': ['/automation-builder', '/system-monitor']
};

// Mapear rotas para imports
const routeImports: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/atendimento': () => import('@/pages/Atendimento'),
  '/contatos': () => import('@/pages/Contatos'),
  '/chat-interno': () => import('@/pages/ChatInterno'),
  '/kanban': () => import('@/pages/Kanban'),
  '/chatbot': () => import('@/pages/ChatBot'),
  '/analytics': () => import('@/components/analytics/ComprehensiveAnalytics'),
  '/usuarios': () => import('@/pages/Usuarios'),
  '/setores': () => import('@/pages/Setores'),
  '/gerenciar-equipe': () => import('@/pages/GerenciarEquipe'),
  '/templates': () => import('@/components/templates/AdvancedTemplateManager'),
  '/automation-builder': () => import('@/components/automation/AdvancedAutomationBuilder'),
  '/system-monitor': () => import('@/components/performance/SystemMonitor'),
  '/webhooks': () => import('@/components/integrations/WebhookManager'),
  '/meu-perfil': () => import('@/pages/MeuPerfil'),
  '/painel': () => import('@/pages/Painel')
};

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  maxConcurrent?: number;
  debounceMs?: number;
}

export function useSmartPreload(options: PreloadOptions = {}) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [preloadedRoutes, setPreloadedRoutes] = useState<Set<string>>(new Set());
  const preloadQueue = useRef<string[]>([]);
  const isPreloading = useRef(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    priority = 'medium',
    maxConcurrent = isMobile ? 2 : 4,
    debounceMs = 100
  } = options;

  // Registrar acesso à rota atual
  useEffect(() => {
    const currentPath = location.pathname;
    const currentAccess = routeAccessHistory.get(currentPath) || 0;
    routeAccessHistory.set(currentPath, currentAccess + 1);
  }, [location.pathname]);

  // Precarregar rota individual
  const preloadRoute = useCallback(async (routePath: string): Promise<boolean> => {
    // Verificar se já está precarregado
    if (preloadedRoutes.has(routePath) || preloadCache.has(routePath)) {
      return true;
    }

    // Verificar se a rota tem import definido
    const importFn = routeImports[routePath];
    if (!importFn) {
      return false;
    }

    try {
      console.log(`🚀 Preloading route: ${routePath}`);
      
      const startTime = performance.now();
      const modulePromise = importFn();
      
      // Armazenar no cache
      preloadCache.set(routePath, modulePromise);
      
      await modulePromise;
      
      const loadTime = performance.now() - startTime;
      console.log(`✅ Route ${routePath} preloaded in ${Math.round(loadTime)}ms`);
      
      setPreloadedRoutes(prev => new Set([...prev, routePath]));
      return true;
    } catch (error) {
      console.warn(`❌ Failed to preload route ${routePath}:`, error);
      preloadCache.delete(routePath);
      return false;
    }
  }, [preloadedRoutes]);

  // Processar fila de preload
  const processPreloadQueue = useCallback(async () => {
    if (isPreloading.current || preloadQueue.current.length === 0) {
      return;
    }

    isPreloading.current = true;

    try {
      // Processar até maxConcurrent rotas por vez
      const batch = preloadQueue.current.splice(0, maxConcurrent);
      
      const promises = batch.map(route => preloadRoute(route));
      await Promise.allSettled(promises);
      
      // Processar próximo batch se houver
      if (preloadQueue.current.length > 0) {
        setTimeout(() => processPreloadQueue(), 50);
      }
    } finally {
      isPreloading.current = false;
    }
  }, [maxConcurrent, preloadRoute]);

  // Adicionar rota à fila de preload
  const queuePreload = useCallback((routePath: string, priorityLevel: 'high' | 'medium' | 'low' = priority) => {
    if (preloadedRoutes.has(routePath) || preloadQueue.current.includes(routePath)) {
      return;
    }

    // Inserir na posição correta baseado na prioridade
    const insertIndex = priorityLevel === 'high' ? 0 : 
                       priorityLevel === 'medium' ? Math.floor(preloadQueue.current.length / 2) :
                       preloadQueue.current.length;
    
    preloadQueue.current.splice(insertIndex, 0, routePath);

    // Debounce para evitar processamento excessivo
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      processPreloadQueue();
    }, debounceMs);
  }, [priority, preloadedRoutes, processPreloadQueue, debounceMs]);

  // Precarregar rotas relacionadas baseado na rota atual
  const preloadRelatedRoutes = useCallback(() => {
    const currentPath = location.pathname;
    const relatedRoutes = routeDependencies[currentPath] || [];
    
    // Filtrar rotas baseado na frequência de acesso
    const sortedRelatedRoutes = relatedRoutes
      .map(route => ({
        route,
        accessCount: routeAccessHistory.get(route) || 0
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .map(item => item.route);

    // Precarregar com prioridade baseada na frequência
    sortedRelatedRoutes.forEach((route, index) => {
      const routePriority = index === 0 ? 'high' : index < 3 ? 'medium' : 'low';
      queuePreload(route, routePriority);
    });
  }, [location.pathname, queuePreload]);

  // Preload inteligente baseado na rota atual
  useEffect(() => {
    // Não precarregar em conexões lentas ou offline
    if (!isOnline || (isSlowConnection && isMobile)) {
      return;
    }

    // Aguardar um pouco após mudança de rota para não interferir no carregamento atual
    const timer = setTimeout(() => {
      preloadRelatedRoutes();
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.pathname, isOnline, isSlowConnection, isMobile, preloadRelatedRoutes]);

  // Preload em hover/focus (para desktop)
  const handleInteraction = useCallback((routePath: string, interactionType: 'hover' | 'focus' = 'hover') => {
    if (isMobile && interactionType === 'hover') {
      return; // Não fazer hover preload no mobile
    }

    if (!isOnline || isSlowConnection) {
      return;
    }

    queuePreload(routePath, 'high');
  }, [isMobile, isOnline, isSlowConnection, queuePreload]);

  // Limpar timers no cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Obter estatísticas de cache
  const getCacheStats = useCallback(() => {
    return {
      preloadedCount: preloadedRoutes.size,
      queueLength: preloadQueue.current.length,
      cacheSize: preloadCache.size,
      routeAccessHistory: Object.fromEntries(routeAccessHistory),
      totalPreloadedRoutes: Array.from(preloadedRoutes)
    };
  }, [preloadedRoutes]);

  return {
    preloadedRoutes: Array.from(preloadedRoutes),
    queuePreload,
    preloadRoute,
    handleInteraction,
    getCacheStats,
    isPreloading: isPreloading.current,
    queueLength: preloadQueue.current.length
  };
}

// Hook para prefetch automático de recursos críticos
export function useCriticalResourcePreload() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [preloadedResources, setPreloadedResources] = useState<Set<string>>(new Set());

  const preloadCriticalResources = useCallback(() => {
    if (!isOnline || isSlowConnection) {
      return;
    }

    // Componentes UI críticos
    const criticalComponents = [
      () => import('@/components/ui/button'),
      () => import('@/components/ui/input'),
      () => import('@/components/ui/dialog'),
      () => import('@/components/ui/card'),
      () => import('@/components/ui/table'),
      () => import('@/components/ui/skeleton')
    ];

    // Hooks críticos
    const criticalHooks = [
      () => import('@/hooks/useAuth'),
      () => import('@/hooks/useContatos'),
      () => import('@/hooks/useAtendimento')
    ];

    const allCritical = [...criticalComponents, ...criticalHooks];

    // Precarregar em chunks pequenos para não sobrecarregar
    const chunkSize = 2;
    let currentChunk = 0;

    const preloadChunk = () => {
      const chunk = allCritical.slice(currentChunk * chunkSize, (currentChunk + 1) * chunkSize);
      
      if (chunk.length === 0) return;

      const promises = chunk.map(loader => {
        try {
          return loader();
        } catch (error) {
          console.warn('Failed to preload critical resource:', error);
          return Promise.resolve();
        }
      });

      Promise.allSettled(promises).then(() => {
        setPreloadedResources(prev => new Set([...prev, `chunk-${currentChunk}`]));
        
        currentChunk++;
        if (currentChunk * chunkSize < allCritical.length) {
          setTimeout(preloadChunk, 100); // Pequeno delay entre chunks
        }
      });
    };

    // Iniciar preload quando idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadChunk);
    } else {
      setTimeout(preloadChunk, 100);
    }
  }, [isOnline, isSlowConnection]);

  useEffect(() => {
    // Aguardar carregamento inicial antes de precarregar recursos críticos
    const timer = setTimeout(preloadCriticalResources, 2000);
    return () => clearTimeout(timer);
  }, [preloadCriticalResources]);

  return {
    preloadedResources: Array.from(preloadedResources),
    preloadCriticalResources
  };
}