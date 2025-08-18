/**
 * Otimizações específicas para ambiente de produção
 */

export function initProductionOptimizations() {
  // Apenas em produção
  if (!import.meta.env.PROD) {
    console.log('🏭 Production optimizations skipped (development mode)');
    return;
  }

  // Desabilitar React DevTools em produção
  if (typeof window !== 'undefined') {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      isDisabled: true,
      supportsFiber: true,
      inject: () => {},
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {}
    };
  }

  // Otimizar console para produção (manter apenas erros)
  const originalConsole = { ...console };
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;

  // Preconnect para domínios críticos
  const criticalDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.whatsapp.com'
  ];

  criticalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // DNS prefetch para domínios secundários
  const secondaryDomains = [
    'https://cdn.jsdelivr.net',
    'https://unpkg.com'
  ];

  secondaryDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  // Monitoramento de performance
  if ('performance' in window) {
    // Marcar início da aplicação
    performance.mark('app-init-start');
    
    window.addEventListener('load', () => {
      performance.mark('app-init-end');
      
      try {
        performance.measure('app-init-duration', 'app-init-start', 'app-init-end');
        
        const measure = performance.getEntriesByName('app-init-duration')[0];
        if (measure) {
          // Em produção, enviar métricas para monitoramento
          const metrics = {
            loadTime: measure.duration,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
          };
          
          // Armazenar localmente para análise
          localStorage.setItem('last-performance-metrics', JSON.stringify(metrics));
        }
      } catch (e) {
        // Ignorar erros de medição
      }
    });
  }

  // Otimização de recursos críticos
  const criticalResources = [
    { href: '/manifest.json', rel: 'manifest' },
    { href: '/favicon.ico', rel: 'icon', type: 'image/x-icon' }
  ];

  criticalResources.forEach(resource => {
    const existing = document.querySelector(`link[href="${resource.href}"]`);
    if (!existing) {
      const link = document.createElement('link');
      Object.assign(link, resource);
      document.head.appendChild(link);
    }
  });

  // Service Worker registration (se disponível)
  if ('serviceWorker' in navigator) {
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

  console.log('🏭 Production optimizations applied');
}