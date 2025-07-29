/**
 * Otimizações específicas para produção
 */

// Configurações de produção
export const PRODUCTION_CONFIG = {
  enableCodeSplitting: true,
  enableTreeShaking: true,
  enableCompression: true,
  enableCaching: true,
  enableServiceWorker: true,
  enableAnalytics: false, // Desabilitar em produção para performance
  enableDebugLogs: false,
  chunkSizeLimit: 244, // KB
  assetSizeLimit: 500, // KB
};

// Code splitting inteligente
export const createCodeSplitting = () => {
  const routeChunks = new Map();
  
  return {
    registerRoute: (path: string, component: () => Promise<any>) => {
      routeChunks.set(path, component);
    },
    
    preloadRoute: (path: string) => {
      const chunk = routeChunks.get(path);
      if (chunk && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          chunk();
        });
      }
    },
    
    getRouteChunks: () => routeChunks
  };
};

// Tree shaking helper
export const treeShakeHelper = {
  // Marcar imports não utilizados
  markUnusedImports: (imports: string[]) => {
    if (import.meta.env.DEV) {
      console.warn('Unused imports detected:', imports);
    }
  },
  
  // Detectar componentes não utilizados
  detectUnusedComponents: (components: string[]) => {
    if (import.meta.env.DEV) {
      const unused = components.filter(comp => 
        !document.querySelector(`[data-component="${comp}"]`)
      );
      if (unused.length > 0) {
        console.warn('Potentially unused components:', unused);
      }
    }
  }
};

// Compressão de assets
export const assetCompression = {
  // Comprimir imagens lazy
  compressImages: async (images: NodeListOf<HTMLImageElement>) => {
    if ('createImageBitmap' in window) {
      for (const img of images) {
        if (img.dataset.compress === 'true') {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              ctx.drawImage(img, 0, 0);
              const compressedData = canvas.toDataURL('image/webp', 0.8);
              img.src = compressedData;
            }
          } catch (error) {
            console.warn('Image compression failed:', error);
          }
        }
      }
    }
  },
  
  // Comprimir texto/JSON
  compressData: (data: string): string => {
    try {
      // Simples compressão removendo espaços desnecessários
      return JSON.stringify(JSON.parse(data));
    } catch {
      return data.replace(/\s+/g, ' ').trim();
    }
  }
};

// Cache estratégico para produção
export const productionCache = {
  // Cache de API com TTL
  apiCache: new Map<string, { data: any; timestamp: number; ttl: number }>(),
  
  set: (key: string, data: any, ttl: number = 300000) => { // 5 min default
    productionCache.apiCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  },
  
  get: (key: string) => {
    const cached = productionCache.apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    productionCache.apiCache.delete(key);
    return null;
  },
  
  clear: () => {
    productionCache.apiCache.clear();
  },
  
  // Limpeza automática
  startCleanup: () => {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of productionCache.apiCache.entries()) {
        if (now - value.timestamp > value.ttl) {
          productionCache.apiCache.delete(key);
        }
      }
    }, 60000); // Cleanup a cada minuto
  }
};

// Service Worker avançado
export const advancedServiceWorker = {
  register: async () => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                // Notificar usuário sobre atualização disponível
                if (navigator.serviceWorker.controller) {
                  console.log('Nova versão disponível');
                }
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.warn('SW registration failed:', error);
      }
    }
  },
  
  // Estratégias de cache
  cacheStrategies: {
    networkFirst: 'network-first',
    cacheFirst: 'cache-first',
    staleWhileRevalidate: 'stale-while-revalidate'
  }
};

// Bundle analyzer em tempo real
export const bundleAnalyzer = {
  // Analisar chunks carregados
  analyzeChunks: () => {
    if (import.meta.env.DEV) {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const chunks = scripts.map(script => {
        const src = (script as HTMLScriptElement).src;
        return {
          name: src.split('/').pop() || 'unknown',
          size: 'unknown',
          loaded: true
        };
      });
      
      console.table(chunks);
      return chunks;
    }
  },
  
  // Medir performance de chunks
  measureChunkPerformance: (chunkName: string) => {
    if (import.meta.env.DEV) {
      performance.mark(`chunk-${chunkName}-start`);
      
      return () => {
        performance.mark(`chunk-${chunkName}-end`);
        performance.measure(
          `chunk-${chunkName}`,
          `chunk-${chunkName}-start`,
          `chunk-${chunkName}-end`
        );
      };
    }
    return () => {};
  }
};

// Inicializar todas as otimizações de produção
export const initProductionOptimizations = () => {
  if (import.meta.env.PROD) {
    // 1. Registrar Service Worker
    advancedServiceWorker.register();
    
    // 2. Iniciar cache cleanup
    productionCache.startCleanup();
    
    // 3. Comprimir imagens após carregamento
    window.addEventListener('load', () => {
      const images = document.querySelectorAll('img[data-compress="true"]') as NodeListOf<HTMLImageElement>;
      assetCompression.compressImages(images);
    });
    
    // 4. Remover event listeners desnecessários
    window.addEventListener('beforeunload', () => {
      productionCache.clear();
    });
    
  } else {
    // Ferramentas de desenvolvimento
    bundleAnalyzer.analyzeChunks();
  }
};

export default {
  PRODUCTION_CONFIG,
  createCodeSplitting,
  treeShakeHelper,
  assetCompression,
  productionCache,
  advancedServiceWorker,
  bundleAnalyzer,
  initProductionOptimizations
};