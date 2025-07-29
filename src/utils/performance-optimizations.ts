/**
 * Otimizações de performance para o sistema
 */

// Limpar timers e listeners desnecessários
export const cleanupResources = () => {
  // Não fazer cleanup de timers em produção para evitar problemas
  if (import.meta.env.DEV) {
    console.log('Limpando recursos de desenvolvimento...');
  }
};

// Debounce para otimizar eventos
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle para otimizar scroll e resize
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Preload crítico apenas quando necessário
export const preloadCritical = () => {
  // Preload apenas se houver bandwidth suficiente
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
      requestIdleCallback(() => {
        // Preload assets críticos
        const criticalAssets = [
          '/icons/icon-192x192.png',
          '/fonts/Inter-Regular.woff2'
        ];
        
        criticalAssets.forEach(asset => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = asset;
          link.as = asset.endsWith('.woff2') ? 'font' : 'image';
          if (asset.endsWith('.woff2')) {
            link.crossOrigin = 'anonymous';
          }
          document.head.appendChild(link);
        });
      });
    }
  }
};

// Lazy loading de imagens inteligente
export const setupLazyImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

// Otimização de memoria - limpeza de cache
export const optimizeMemory = () => {
  // Limpar localStorage antigo
  const oldKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('old_') || 
    key.includes('cache_') ||
    key.includes('temp_')
  );
  
  oldKeys.forEach(key => localStorage.removeItem(key));
};

// Service Worker para cache otimizado
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Inicializar todas as otimizações
export const initPerformanceOptimizations = () => {
  // Executar após DOM carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupLazyImages();
      preloadCritical();
      initSecurityMonitoring();
    });
  } else {
    setupLazyImages();
    preloadCritical();
    initSecurityMonitoring();
  }
  
  // Limpar recursos ao sair da página
  window.addEventListener('beforeunload', () => {
    cleanupResources();
  });
  
  // Otimizar memoria periodicamente (apenas em dev)
  if (import.meta.env.DEV) {
    setInterval(optimizeMemory, 300000); // 5 minutos
  }
  
  // Service Worker
  registerServiceWorker();
  
  // Performance monitoring
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      // Log apenas se performance estiver ruim
      const totalTime = perfData.loadEventEnd - perfData.fetchStart;
      if (totalTime > 2000) {
        console.warn(`Performance alert: ${Math.round(totalTime)}ms load time`);
      }
    });
  }
};

// Inicializar monitoramento de segurança
const initSecurityMonitoring = () => {
  // Detectar tentativas de manipulação de console
  if (import.meta.env.PROD) {
    const originalConsole = { ...console };
    
    Object.keys(console).forEach(key => {
      (console as any)[key] = (...args: any[]) => {
        // Log suspeito se alguém usar console em produção
        originalConsole.warn('Console access detected in production');
      };
    });
  }
  
  // Detectar tentativas de debug
  const devtools = {
    open: false,
    orientation: null
  };
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
      if (!devtools.open) {
        devtools.open = true;
        if (import.meta.env.PROD) {
          console.warn('DevTools opened in production');
        }
      }
    } else {
      devtools.open = false;
    }
  }, 500);
};