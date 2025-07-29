/**
 * Code splitting inteligente para otimizar carregamento
 */

import { lazy, ComponentType } from 'react';

// Interface para configuração de chunks
interface ChunkConfig {
  name: string;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

// Cache de componentes lazy
const lazyCache = new Map<string, ComponentType<any>>();

// Criar lazy component com configuração
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: ChunkConfig
): ComponentType<any> => {
  const cacheKey = config.name;
  
  if (lazyCache.has(cacheKey)) {
    return lazyCache.get(cacheKey)!;
  }
  
  const LazyComponent = lazy(() => {
    // Marcar início do carregamento
    performance.mark(`chunk-${config.name}-start`);
    
    return importFn().then(module => {
      // Marcar fim do carregamento
      performance.mark(`chunk-${config.name}-end`);
      performance.measure(
        `chunk-${config.name}`,
        `chunk-${config.name}-start`,
        `chunk-${config.name}-end`
      );
      
      return module;
    });
  });
  
  lazyCache.set(cacheKey, LazyComponent);
  return LazyComponent;
};

// Preload de chunks baseado em prioridade
export const preloadChunks = {
  high: [] as (() => Promise<any>)[],
  medium: [] as (() => Promise<any>)[],
  low: [] as (() => Promise<any>)[]
};

// Registrar chunk para preload
export const registerChunkForPreload = (
  importFn: () => Promise<any>,
  priority: 'high' | 'medium' | 'low' = 'medium'
) => {
  preloadChunks[priority].push(importFn);
};

// Executar preload baseado na prioridade e condições da rede
export const executePreload = () => {
  // Verificar condições da rede
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData
  );
  
  if (isSlowConnection) {
    // Apenas chunks de alta prioridade em conexões lentas
    preloadWithPriority('high');
  } else {
    // Preload progressivo baseado na prioridade
    requestIdleCallback(() => {
      preloadWithPriority('high');
      
      setTimeout(() => {
        preloadWithPriority('medium');
        
        setTimeout(() => {
          preloadWithPriority('low');
        }, 2000);
      }, 1000);
    });
  }
};

// Preload por prioridade
const preloadWithPriority = (priority: 'high' | 'medium' | 'low') => {
  preloadChunks[priority].forEach(chunk => {
    try {
      chunk();
    } catch (error) {
      console.warn(`Preload failed for ${priority} priority chunk:`, error);
    }
  });
};

// Lazy components principais do sistema
export const LazyComponents = {
  // Admin components
  AdminDashboard: createLazyComponent(
    () => import('@/pages/SuperAdmin'),
    { name: 'admin-dashboard', priority: 'medium' }
  ),
  
  // Chat components
  ChatInterno: createLazyComponent(
    () => import('@/pages/ChatInterno'),
    { name: 'chat-interno', priority: 'high' }
  ),
  
  // Flow builder
  FlowBuilder: createLazyComponent(
    () => import('@/pages/FlowBuilder'),
    { name: 'flow-builder', priority: 'low', dependencies: ['@xyflow/react'] }
  ),
  
  // Analytics
  AnalyticsDashboard: createLazyComponent(
    () => import('@/components/analytics/ComprehensiveAnalytics').then(m => ({ default: m.ComprehensiveAnalytics })),
    { name: 'analytics', priority: 'medium' }
  ),
  
  // Reports
  AdvancedReports: createLazyComponent(
    () => import('@/components/reports/AdvancedReports').then(m => ({ default: m.AdvancedReports })),
    { name: 'reports', priority: 'low' }
  ),
  
  // Automations
  AutomationBuilder: createLazyComponent(
    () => import('@/components/automation/AdvancedAutomationBuilder').then(m => ({ default: m.AdvancedAutomationBuilder })),
    { name: 'automation', priority: 'medium' }
  ),
  
  // Monitoring
  SystemMonitoring: createLazyComponent(
    () => import('@/components/monitoring/SystemMonitoringDashboard').then(m => ({ default: m.SystemMonitoringDashboard })),
    { name: 'monitoring', priority: 'medium' }
  )
};

// Registrar chunks para preload
registerChunkForPreload(() => import('@/pages/ChatInterno'), 'high');
registerChunkForPreload(() => import('@/pages/Atendimento'), 'high');
registerChunkForPreload(() => import('@/pages/Dashboard'), 'high');
registerChunkForPreload(() => import('@/pages/SuperAdmin'), 'medium');
registerChunkForPreload(() => import('@/components/analytics/ComprehensiveAnalytics'), 'medium');
registerChunkForPreload(() => import('@/pages/FlowBuilder'), 'low');

// Monitoramento de chunks
export const chunkMonitoring = {
  // Rastrear chunks carregados
  loadedChunks: new Set<string>(),
  
  // Rastrear falhas de carregamento
  failedChunks: new Set<string>(),
  
  onChunkLoad: (chunkName: string) => {
    chunkMonitoring.loadedChunks.add(chunkName);
    
    if (import.meta.env.DEV) {
      console.log(`✅ Chunk loaded: ${chunkName}`);
    }
  },
  
  onChunkError: (chunkName: string, error: Error) => {
    chunkMonitoring.failedChunks.add(chunkName);
    
    console.error(`❌ Chunk failed: ${chunkName}`, error);
  },
  
  getStats: () => ({
    loaded: chunkMonitoring.loadedChunks.size,
    failed: chunkMonitoring.failedChunks.size,
    loadedChunks: Array.from(chunkMonitoring.loadedChunks),
    failedChunks: Array.from(chunkMonitoring.failedChunks)
  })
};

// Inicializar code splitting
export const initCodeSplitting = () => {
  // Executar preload após carregamento inicial
  window.addEventListener('load', () => {
    setTimeout(executePreload, 1000);
  });
  
  // Preload baseado em hover (para desktop)
  if (window.innerWidth > 768) {
    document.addEventListener('mouseenter', (e) => {
      const target = e.target as HTMLElement;
      const route = target.getAttribute('data-preload-route');
      
      if (route) {
        preloadRouteChunk(route);
      }
    }, { passive: true });
  }
  
  // Log de estatísticas em dev
  if (import.meta.env.DEV) {
    setTimeout(() => {
      console.log('Chunk Statistics:', chunkMonitoring.getStats());
    }, 5000);
  }
};

// Preload de chunk específico por rota
const preloadRouteChunk = (route: string) => {
  const routeChunkMap: Record<string, () => Promise<any>> = {
    '/admin': () => import('@/pages/SuperAdmin'),
    '/chat-interno': () => import('@/pages/ChatInterno'),
    '/flow-builder': () => import('@/pages/FlowBuilder'),
    '/analytics': () => import('@/components/analytics/ComprehensiveAnalytics'),
    '/automation': () => import('@/components/automation/AdvancedAutomationBuilder')
  };
  
  const chunk = routeChunkMap[route];
  if (chunk) {
    chunk().catch(error => {
      console.warn(`Preload failed for route ${route}:`, error);
    });
  }
};

export default {
  createLazyComponent,
  LazyComponents,
  registerChunkForPreload,
  executePreload,
  chunkMonitoring,
  initCodeSplitting
};