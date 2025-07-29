/**
 * Inicialização de otimizações de performance para o módulo de atendimento
 */

// Inicializar todas as otimizações de performance
export function initAttendancePerformanceOptimizations() {
  console.log('🚀 Inicializando otimizações de performance do módulo de atendimento...');
  
  // 1. Configurar preload de recursos críticos
  setupCriticalResourcePreload();
  
  // 2. Configurar cache inteligente
  setupIntelligentCaching();
  
  // 3. Configurar lazy loading
  setupLazyLoading();
  
  // 4. Configurar monitoramento de performance
  if (import.meta.env.DEV) {
    setupPerformanceMonitoring();
  }
  
  // 5. Configurar otimizações de scroll
  setupScrollOptimizations();
  
  console.log('✅ Otimizações de performance inicializadas com sucesso!');
}

// Preload de recursos críticos
function setupCriticalResourcePreload() {
  // Preload apenas se bandwidth permitir
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection.effectiveType === '4g' || !connection.saveData) {
      requestIdleCallback(() => {
        // Preload fontes críticas
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = '/fonts/Inter-Regular.woff2';
        fontLink.as = 'font';
        fontLink.type = 'font/woff2';
        fontLink.crossOrigin = 'anonymous';
        document.head.appendChild(fontLink);
        
        // Preload ícones críticos
        const iconLink = document.createElement('link');
        iconLink.rel = 'preload';
        iconLink.href = '/icons/icon-192x192.png';
        iconLink.as = 'image';
        document.head.appendChild(iconLink);
      });
    }
  }
}

// Cache inteligente para dados frequentes
function setupIntelligentCaching() {
  // Configurar cache de conversas
  const conversasCache = new Map();
  
  // Limpar cache antigo periodicamente
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of conversasCache.entries()) {
      if (now - data.timestamp > 5 * 60 * 1000) { // 5 minutos
        conversasCache.delete(key);
      }
    }
  }, 60000); // Verificar a cada minuto
  
  // Disponibilizar cache globalmente para outros hooks
  (window as any).__conversasCache = conversasCache;
}

// Lazy loading otimizado
function setupLazyLoading() {
  // Configurar Intersection Observer para lazy loading
  if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // Lazy load de imagens
          if (element.tagName === 'IMG' && element.dataset.src) {
            (element as HTMLImageElement).src = element.dataset.src;
            element.classList.remove('lazy');
            lazyObserver.unobserve(element);
          }
          
          // Lazy load de componentes
          if (element.dataset.lazyComponent) {
            element.dispatchEvent(new CustomEvent('lazyload'));
            lazyObserver.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });
    
    // Disponibilizar observer globalmente
    (window as any).__lazyObserver = lazyObserver;
  }
}

// Monitoramento de performance (apenas dev)
function setupPerformanceMonitoring() {
  // Long tasks observer
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks > 50ms
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.log('Long task observer não suportado');
    }
  }
  
  // Memory monitoring
  if ((performance as any).memory) {
    setInterval(() => {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize;
      const limit = memory.jsHeapSizeLimit;
      const percentage = (usage / limit) * 100;
      
      if (percentage > 75) {
        console.warn(`🧠 High memory usage: ${percentage.toFixed(1)}% (${(usage / 1024 / 1024).toFixed(1)}MB)`);
      }
    }, 30000); // Verificar a cada 30 segundos
  }
}

// Otimizações de scroll
function setupScrollOptimizations() {
  let scrollTimeout: NodeJS.Timeout;
  let isScrolling = false;
  
  const optimizedScrollHandler = () => {
    if (!isScrolling) {
      // Primeiro scroll - aplicar otimizações imediatas
      document.body.classList.add('scrolling');
      isScrolling = true;
    }
    
    // Limpar timeout anterior
    clearTimeout(scrollTimeout);
    
    // Definir timeout para fim do scroll
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('scrolling');
      isScrolling = false;
    }, 150);
  };
  
  // Aplicar scroll otimizado a todos os containers relevantes
  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
  
  // CSS para otimizações de scroll
  const scrollStyles = document.createElement('style');
  scrollStyles.textContent = `
    .scrolling * {
      pointer-events: none !important;
    }
    
    .scrolling img {
      transform: translateZ(0);
    }
    
    .scrolling .complex-animation {
      animation-play-state: paused !important;
    }
  `;
  document.head.appendChild(scrollStyles);
}

// Detectar performance do dispositivo
export function detectDevicePerformance() {
  const navigator = window.navigator as any;
  let score = 0;
  
  // Hardware
  if (navigator.hardwareConcurrency) {
    score += Math.min(navigator.hardwareConcurrency * 2, 10);
  }
  
  // Memória
  if (navigator.deviceMemory) {
    score += Math.min(navigator.deviceMemory, 8);
  }
  
  // Conexão
  if (navigator.connection) {
    const conn = navigator.connection;
    if (conn.effectiveType === '4g') score += 5;
    else if (conn.effectiveType === '3g') score += 3;
    else if (conn.effectiveType === 'slow-2g') score -= 2;
  }
  
  // Determinar categoria
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

// Aplicar otimizações baseadas na performance
export function applyPerformanceBasedOptimizations() {
  const performance = detectDevicePerformance();
  
  const optimizations = {
    high: {
      virtualScrollThreshold: 50,
      animationsEnabled: true,
      prefetchEnabled: true,
      cacheSize: 100
    },
    medium: {
      virtualScrollThreshold: 30,
      animationsEnabled: true,
      prefetchEnabled: false,
      cacheSize: 50
    },
    low: {
      virtualScrollThreshold: 20,
      animationsEnabled: false,
      prefetchEnabled: false,
      cacheSize: 25
    }
  };
  
  const config = optimizations[performance];
  
  // Aplicar configurações globais
  (window as any).__performanceConfig = {
    devicePerformance: performance,
    ...config
  };
  
  // Adicionar classe CSS baseada na performance
  document.documentElement.classList.add(`device-${performance}`);
  
  // CSS específico para cada categoria
  const performanceStyles = document.createElement('style');
  performanceStyles.textContent = `
    .device-low * {
      animation-duration: 0.1s !important;
      transition-duration: 0.1s !important;
    }
    
    .device-low .complex-shadow {
      box-shadow: none !important;
    }
    
    .device-low .gradient-bg {
      background: solid !important;
    }
    
    .device-medium .heavy-animation {
      animation: none !important;
    }
  `;
  document.head.appendChild(performanceStyles);
  
  console.log(`📱 Device performance: ${performance}`, config);
  
  return config;
}

// Limpar recursos quando não precisar mais
export function cleanupPerformanceOptimizations() {
  // Limpar observers
  const lazyObserver = (window as any).__lazyObserver;
  if (lazyObserver) {
    lazyObserver.disconnect();
  }
  
  // Limpar cache
  const conversasCache = (window as any).__conversasCache;
  if (conversasCache) {
    conversasCache.clear();
  }
  
  console.log('🧹 Performance optimizations cleaned up');
}