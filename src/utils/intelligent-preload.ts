/**
 * Sistema de preload inteligente para otimizar carregamento
 * Pré-carrega recursos baseado no comportamento do usuário
 */

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  retries?: number;
}

class IntelligentPreloader {
  private preloadedUrls = new Set<string>();
  private pendingPreloads = new Map<string, Promise<void>>();
  private observer?: IntersectionObserver;

  constructor() {
    this.setupIntersectionObserver();
    this.setupUserBehaviorTracking();
  }

  /**
   * Preload de URLs baseado em prioridade
   */
  async preloadUrl(url: string, options: PreloadOptions = {}): Promise<void> {
    const { priority = 'medium', timeout = 5000, retries = 2 } = options;

    if (this.preloadedUrls.has(url) || this.pendingPreloads.has(url)) {
      return this.pendingPreloads.get(url) || Promise.resolve();
    }

    const preloadPromise = this.performPreload(url, priority, timeout, retries);
    this.pendingPreloads.set(url, preloadPromise);

    try {
      await preloadPromise;
      this.preloadedUrls.add(url);
    } catch (error) {
      console.warn(`Preload failed for ${url}:`, error);
    } finally {
      this.pendingPreloads.delete(url);
    }
  }

  private async performPreload(
    url: string, 
    priority: string, 
    timeout: number, 
    retries: number
  ): Promise<void> {
    let attempt = 0;
    
    while (attempt <= retries) {
      try {
        await this.fetchWithTimeout(url, timeout, priority);
        return;
      } catch (error) {
        attempt++;
        if (attempt > retries) throw error;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  private fetchWithTimeout(url: string, timeout: number, priority: string): Promise<Response> {
    const controller = new AbortController();
    const signal = controller.signal;

    // Timeout handler
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url, { 
      signal,
      cache: 'force-cache',
      mode: 'cors',
      credentials: 'same-origin'
    }).then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    }).catch(error => {
      clearTimeout(timeoutId);
      throw error;
    });
  }

  /**
   * Preload de componentes React
   */
  preloadComponent(importFn: () => Promise<any>): Promise<any> {
    return importFn().catch(error => {
      console.warn('Component preload failed:', error);
      return null;
    });
  }

  /**
   * Setup do Intersection Observer para preload automático
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadUrl = element.dataset.preload;
            
            if (preloadUrl) {
              this.preloadUrl(preloadUrl, { priority: 'low' });
            }
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );
  }

  /**
   * Observar elemento para preload automático
   */
  observeElement(element: HTMLElement): void {
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  /**
   * Setup de tracking de comportamento do usuário
   */
  private setupUserBehaviorTracking(): void {
    if (typeof window === 'undefined') return;

    // Preload em hover (desktop)
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && this.isInternalLink(link.href)) {
        this.preloadUrl(link.href, { priority: 'high' });
      }
    });

    // Preload em touch start (mobile)
    document.addEventListener('touchstart', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && this.isInternalLink(link.href)) {
        this.preloadUrl(link.href, { priority: 'high' });
      }
    });

    // Preload baseado em scroll pattern
    this.setupScrollPatternPreload();
  }

  private setupScrollPatternPreload(): void {
    let scrollDirection: 'up' | 'down' = 'down';
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const scrollHandler = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      
      scrollDirection = deltaY > 0 ? 'down' : 'up';
      scrollVelocity = Math.abs(deltaY);
      
      // Se usuário está scrollando rápido para baixo, preload mais conteúdo
      if (scrollDirection === 'down' && scrollVelocity > 10) {
        this.preloadNearbyContent();
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  private preloadNearbyContent(): void {
    // Procurar por links e imagens próximas à viewport
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const preloadZone = {
      top: scrollTop + viewportHeight,
      bottom: scrollTop + viewportHeight * 2
    };

    // Preload de links
    document.querySelectorAll('a[href]').forEach(link => {
      const rect = link.getBoundingClientRect();
      const elementTop = rect.top + scrollTop;
      
      if (elementTop >= preloadZone.top && elementTop <= preloadZone.bottom) {
        const href = (link as HTMLAnchorElement).href;
        if (this.isInternalLink(href)) {
          this.preloadUrl(href, { priority: 'medium' });
        }
      }
    });

    // Preload de imagens
    document.querySelectorAll('img[data-src]').forEach(img => {
      const rect = img.getBoundingClientRect();
      const elementTop = rect.top + scrollTop;
      
      if (elementTop >= preloadZone.top && elementTop <= preloadZone.bottom) {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
          this.preloadUrl(dataSrc, { priority: 'low' });
        }
      }
    });
  }

  private isInternalLink(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance
export const intelligentPreloader = new IntelligentPreloader();

// Hook para usar preloader em componentes React
export const useIntelligentPreload = () => {
  const preloadUrl = (url: string, options?: PreloadOptions) => {
    return intelligentPreloader.preloadUrl(url, options);
  };

  const preloadComponent = (importFn: () => Promise<any>) => {
    return intelligentPreloader.preloadComponent(importFn);
  };

  const observeElement = (element: HTMLElement | null) => {
    if (element) {
      intelligentPreloader.observeElement(element);
    }
  };

  return { preloadUrl, preloadComponent, observeElement };
};

export default intelligentPreloader;