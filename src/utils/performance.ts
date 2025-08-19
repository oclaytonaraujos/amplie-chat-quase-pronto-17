/**
 * Utilitários de otimização de performance
 */

// Debounce function para otimizar eventos
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

// Throttle function para limitar execuções
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading de imagens
export const lazyLoadImage = (img: HTMLImageElement) => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          if (target.dataset.src) {
            target.src = target.dataset.src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        }
      });
    });
    observer.observe(img);
  } else {
    // Fallback para navegadores sem suporte
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
  }
};

// Otimização de renderização com RAF
export const rafScheduler = (callback: () => void) => {
  if ('requestAnimationFrame' in window) {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 16); // ~60fps fallback
  }
};

// Cache simples em memória
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl = 300000) { // 5 minutos default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const memoryCache = new MemoryCache();

// Cleanup automático de cache
setInterval(() => {
  if (memoryCache.size() > 100) { // Limpar se muito grande
    memoryCache.clear();
  }
}, 600000); // A cada 10 minutos