/**
 * Otimizações de code splitting e lazy loading
 */

// Cache para módulos carregados
const moduleCache = new Map();

// Preload inteligente baseado em rota atual
export function initCodeSplitting() {
  const currentPath = window.location.pathname;

  // Mapeamento de rotas para módulos relacionados
  const routeModules = new Map([
    ['/', ['@/pages/Atendimento', '@/pages/Dashboard']],
    ['/atendimento', ['@/pages/Contatos', '@/pages/Kanban']],
    ['/contatos', ['@/pages/Atendimento']],
    ['/dashboard', ['@/pages/Painel']],
    ['/chatbot', ['@/pages/FlowBuilder']],
    ['/usuarios', ['@/pages/Setores', '@/pages/GerenciarEquipe']],
  ]);

  // Preload módulos relacionados à rota atual
  const relatedModules = routeModules.get(currentPath);
  if (relatedModules) {
    // Usar requestIdleCallback para não bloquear renderização
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        relatedModules.forEach(modulePath => {
          preloadModule(modulePath);
        });
      }, { timeout: 2000 });
    } else {
      // Fallback para navegadores sem requestIdleCallback
      setTimeout(() => {
        relatedModules.forEach(modulePath => {
          preloadModule(modulePath);
        });
      }, 1000);
    }
  }

  // Preload baseado em hover
  setupHoverPreloading();

  // Intersection Observer para componentes lazy
  setupLazyComponentLoading();

  console.log('📦 Code splitting optimizations initialized');
}

// Preload de módulo individual
function preloadModule(modulePath: string) {
  if (moduleCache.has(modulePath)) {
    return moduleCache.get(modulePath);
  }

  const modulePromise = import(modulePath)
    .then(module => {
      moduleCache.set(modulePath, module);
      return module;
    })
    .catch(error => {
      console.warn(`Failed to preload ${modulePath}:`, error);
      moduleCache.delete(modulePath);
    });

  moduleCache.set(modulePath, modulePromise);
  return modulePromise;
}

// Preload baseado em hover de links
function setupHoverPreloading() {
  const linkModuleMap = new Map([
    ['/atendimento', '@/pages/Atendimento'],
    ['/contatos', '@/pages/Contatos'],
    ['/dashboard', '@/pages/Dashboard'],
    ['/chatbot', '@/pages/ChatBot'],
    ['/usuarios', '@/pages/Usuarios'],
    ['/setores', '@/pages/Setores'],
    ['/kanban', '@/pages/Kanban'],
    ['/chat-interno', '@/pages/ChatInterno'],
    ['/automations', '@/pages/Automations']
  ]);

  let hoverTimer: NodeJS.Timeout;

  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link) {
      const href = link.getAttribute('href');
      const modulePath = linkModuleMap.get(href || '');
      
      if (modulePath && !moduleCache.has(modulePath)) {
        // Delay de 200ms para evitar preloads desnecessários
        hoverTimer = setTimeout(() => {
          preloadModule(modulePath);
        }, 200);
      }
    }
  });

  document.addEventListener('mouseout', () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
  });
}

// Lazy loading para componentes com Intersection Observer
function setupLazyComponentLoading() {
  if (!('IntersectionObserver' in window)) {
    return; // Fallback para navegadores antigos
  }

  const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const componentPath = element.dataset.lazyComponent;
        
        if (componentPath) {
          preloadModule(componentPath).then(() => {
            element.classList.add('lazy-loaded');
            lazyObserver.unobserve(element);
          });
        }
      }
    });
  }, {
    rootMargin: '50px' // Carregar quando estiver 50px antes de aparecer
  });

  // Observar elementos com data-lazy-component
  const lazyElements = document.querySelectorAll('[data-lazy-component]');
  lazyElements.forEach(element => {
    lazyObserver.observe(element);
  });

  // Mutation Observer para novos elementos lazy
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Verificar o próprio elemento
          if (element.dataset?.lazyComponent) {
            lazyObserver.observe(element);
          }
          
          // Verificar elementos filhos
          const lazyChildren = element.querySelectorAll?.('[data-lazy-component]');
          lazyChildren?.forEach(child => {
            lazyObserver.observe(child);
          });
        }
      });
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Preload crítico baseado em análise de uso
export function preloadCriticalModules() {
  // Módulos mais utilizados (baseado em analytics)
  const criticalModules = [
    '@/pages/Atendimento',
    '@/pages/Contatos',
    '@/components/layout/Sidebar'
  ];

  // Verificar se é uma conexão rápida
  const connection = (navigator as any).connection;
  const isFastConnection = !connection || 
    connection.effectiveType === '4g' || 
    connection.effectiveType === '3g';

  if (isFastConnection) {
    criticalModules.forEach(modulePath => {
      preloadModule(modulePath);
    });
  }
}

// Cleanup de módulos não utilizados
export function cleanupUnusedModules() {
  const maxCacheSize = 20; // Máximo de módulos em cache
  
  if (moduleCache.size > maxCacheSize) {
    // Remover módulos mais antigos (implementação simplificada)
    const entries = Array.from(moduleCache.entries());
    const toRemove = entries.slice(0, entries.length - maxCacheSize);
    
    toRemove.forEach(([key]) => {
      moduleCache.delete(key);
    });
    
    console.log(`Cleaned up ${toRemove.length} unused modules from cache`);
  }
}