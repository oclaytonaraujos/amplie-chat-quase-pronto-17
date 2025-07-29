/**
 * Inicialização rápida de performance - apenas o essencial
 */

// Cache de recursos críticos
const criticalResourceCache = new Map();

// Preload mínimo de recursos críticos
export const fastPreloadCritical = () => {
  // Apenas CSS e fontes críticas
  const criticalResources = [
    '/fonts/Inter-Regular.woff2'
  ];
  
  criticalResources.forEach(resource => {
    if (!criticalResourceCache.has(resource)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.woff2') ? 'font' : 'style';
      if (resource.endsWith('.woff2')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
      criticalResourceCache.set(resource, true);
    }
  });
};

// Otimização de CSS crítico
export const optimizeCriticalCSS = () => {
  // Aplicar apenas estilos críticos inline
  const criticalCSS = `
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid hsl(var(--muted));
      border-top: 2px solid hsl(var(--primary));
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// Cleanup de recursos desnecessários
export const cleanupUnusedResources = () => {
  // Remover listeners desnecessários
  const unusedListeners = ['resize', 'scroll', 'mousemove'];
  
  unusedListeners.forEach(event => {
    const handlers = (window as any)._eventHandlers?.[event] || [];
    if (handlers.length > 5) {
      console.warn(`Muitos listeners para ${event}: ${handlers.length}`);
    }
  });
};

// Otimização de queries
export const optimizeQueries = () => {
  // Debounce para queries frequentes
  const queryCache = new Map();
  const CACHE_TIME = 30000; // 30 segundos
  
  return {
    getCached: (key: string) => {
      const cached = queryCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
        return cached.data;
      }
      return null;
    },
    setCached: (key: string, data: any) => {
      queryCache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  };
};

// Inicialização ultra-rápida
export const initFastPerformance = () => {
  // 1. CSS crítico primeiro
  optimizeCriticalCSS();
  
  // 2. Preload mínimo
  fastPreloadCritical();
  
  // 3. Cleanup (apenas em dev)
  if (import.meta.env.DEV) {
    setTimeout(cleanupUnusedResources, 5000);
  }
};