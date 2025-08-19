/**
 * Cache inteligente para otimização de performance
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 500;
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Limpar cache se estiver muito grande
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Incrementar hits para LRU
    entry.hits++;
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Evict least recently used entries
  private evictLeastUsed(): void {
    if (this.cache.size === 0) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].hits - b[1].hits);
    
    // Remove 20% dos entries menos usados
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
      totalHits += entry.hits;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      totalHits,
      hitRatio: totalHits / Math.max(this.cache.size, 1)
    };
  }
}

// Instância global
export const performanceCache = new PerformanceCache();

// Auto cleanup a cada 10 minutos
setInterval(() => {
  performanceCache.cleanup();
}, 10 * 60 * 1000);

// Hook para usar cache com React Query
export function useCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;

  const getCachedData = (): T | null => {
    if (!enabled) return null;
    return performanceCache.get<T>(key);
  };

  const setCachedData = (data: T) => {
    if (enabled) {
      performanceCache.set(key, data, ttl);
    }
  };

  return {
    getCachedData,
    setCachedData,
    queryFn: async (): Promise<T> => {
      // Tentar cache primeiro
      const cached = getCachedData();
      if (cached !== null) {
        return cached;
      }

      // Execute query e cache result
      const result = await queryFn();
      setCachedData(result);
      return result;
    }
  };
}