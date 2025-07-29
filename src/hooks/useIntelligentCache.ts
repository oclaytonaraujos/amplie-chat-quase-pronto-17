import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CacheConfig {
  ttl?: number; // Time to live em milissegundos
  maxSize?: number; // Tamanho máximo do cache
  prefetchOnHover?: boolean;
  enablePersistence?: boolean;
  compressionLevel?: 'none' | 'light' | 'heavy';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos
  private maxSize = 100;
  private compressionLevel: 'none' | 'light' | 'heavy' = 'light';

  constructor(config?: CacheConfig) {
    if (config?.ttl) this.defaultTTL = config.ttl;
    if (config?.maxSize) this.maxSize = config.maxSize;
    if (config?.compressionLevel) this.compressionLevel = config.compressionLevel;
    
    // Cleanup automático a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private estimateSize(data: any): number {
    try {
      const str = JSON.stringify(data);
      return str.length * 2; // Estimativa aproximada em bytes
    } catch {
      return 1000; // Fallback
    }
  }

  private compress(data: any): any {
    if (this.compressionLevel === 'none') return data;
    
    try {
      // Compressão simples para arrays e objetos grandes
      if (Array.isArray(data) && data.length > 100) {
        return {
          __compressed: true,
          type: 'array',
          data: data.slice(0, 50), // Manter apenas primeiros 50 itens em cache
          meta: { totalLength: data.length }
        };
      }
      
      if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        if (keys.length > 50 && this.compressionLevel === 'heavy') {
          // Para objetos muito grandes, manter apenas campos essenciais
          const essentialFields = ['id', 'name', 'title', 'status', 'created_at', 'updated_at'];
          const compressed: any = { __compressed: true, type: 'object' };
          
          essentialFields.forEach(field => {
            if (data[field] !== undefined) {
              compressed[field] = data[field];
            }
          });
          
          return compressed;
        }
      }
      
      return data;
    } catch {
      return data;
    }
  }

  private decompress(entry: CacheEntry<any>): any {
    if (!entry.data.__compressed) return entry.data;
    
    // Para dados comprimidos, retornar com indicação de que podem estar incompletos
    return {
      ...entry.data,
      __isCompressed: true,
      __needsRefresh: true
    };
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;
    
    // Limpar cache se estiver cheio
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    const compressedData = this.compress(data);
    const size = this.estimateSize(compressedData);

    const entry: CacheEntry<T> = {
      data: compressedData,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size
    };

    this.cache.set(key, entry);

    // Persistir no localStorage se habilitado
    if (typeof window !== 'undefined') {
      try {
        const persistKey = `cache_${key}`;
        localStorage.setItem(persistKey, JSON.stringify({
          data: compressedData,
          timestamp: now,
          ttl: entryTTL
        }));
      } catch (error) {
        console.warn('Failed to persist cache entry:', error);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      // Tentar recuperar do localStorage
      if (typeof window !== 'undefined') {
        try {
          const persistKey = `cache_${key}`;
          const stored = localStorage.getItem(persistKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (now - parsed.timestamp < parsed.ttl) {
              // Restaurar no cache em memória
              this.cache.set(key, {
                data: parsed.data,
                timestamp: parsed.timestamp,
                accessCount: 1,
                lastAccessed: now,
                size: this.estimateSize(parsed.data)
              });
              return this.decompress({ data: parsed.data } as CacheEntry<T>);
            } else {
              localStorage.removeItem(persistKey);
            }
          }
        } catch (error) {
          console.warn('Failed to restore cache from localStorage:', error);
        }
      }
      return null;
    }

    // Verificar TTL
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = now;

    return this.decompress(entry);
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastAccessCount = Infinity;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount || 
          (entry.accessCount === leastAccessCount && entry.lastAccessed < oldestAccess)) {
        leastUsedKey = key;
        leastAccessCount = entry.accessCount;
        oldestAccess = entry.lastAccessed;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      // Remover do localStorage também
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cache_${leastUsedKey}`);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cache_${key}`);
      }
    });
  }

  clear(): void {
    this.cache.clear();
    // Limpar localStorage relacionado
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  getStats() {
    let totalSize = 0;
    let totalAccessCount = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      totalAccessCount += entry.accessCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalSize,
      totalAccessCount,
      hitRatio: totalAccessCount > 0 ? (this.cache.size / totalAccessCount) * 100 : 0
    };
  }
}

// Instância global do cache
const globalCache = new IntelligentCache();

export function useIntelligentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config?: CacheConfig
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMobile = useIsMobile();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Configurações otimizadas para mobile
  const ttl = config?.ttl || (isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000);
  
  const fetchData = useCallback(async (force = false): Promise<T | null> => {
    // Cancelar requisição anterior se ainda estiver pendente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Verificar cache primeiro
    if (!force) {
      const cached = globalCache.get<T>(key);
      if (cached && !(cached as any).__needsRefresh) {
        setData(cached);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();
      
      const result = await fetcher();
      
      // Armazenar no cache
      globalCache.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err as Error);
        
        // Em caso de erro, tentar usar dados em cache (mesmo que expirados)
        const staleData = globalCache.get<T>(key);
        if (staleData) {
          setData(staleData);
          return staleData;
        }
      }
      return null;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [key, fetcher, ttl]);

  // Prefetch otimizado
  const prefetch = useCallback(() => {
    const cached = globalCache.get<T>(key);
    if (!cached && !loading) {
      fetchData();
    }
  }, [key, loading, fetchData]);

  // Invalidar cache
  const invalidate = useCallback(() => {
    globalCache.set(key, null as any, 0); // TTL 0 = expirado imediatamente
    fetchData(true);
  }, [key, fetchData]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    prefetch,
    invalidate,
    isStale: (data as any)?.__isCompressed || false,
    cacheStats: globalCache.getStats()
  };
}

// Hook para prefetch inteligente baseado em hover/focus
export function usePrefetchOnInteraction() {
  const prefetchCallbacks = useRef<Map<string, () => void>>(new Map());

  const registerPrefetch = useCallback((key: string, callback: () => void) => {
    prefetchCallbacks.current.set(key, callback);
  }, []);

  const handleMouseEnter = useCallback((key: string) => {
    const callback = prefetchCallbacks.current.get(key);
    if (callback) {
      // Debounce para evitar prefetch excessivo
      setTimeout(callback, 100);
    }
  }, []);

  const handleFocus = useCallback((key: string) => {
    const callback = prefetchCallbacks.current.get(key);
    if (callback) {
      callback();
    }
  }, []);

  return {
    registerPrefetch,
    handleMouseEnter,
    handleFocus
  };
}

export { globalCache };