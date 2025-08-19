import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { performanceCache } from '@/utils/performance-cache';
import { logger } from '@/utils/production-logger';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  cacheTime?: number;
  enableOfflineCache?: boolean;
  optimisticUpdate?: boolean;
  backgroundRefetch?: boolean;
}

/**
 * Hook otimizado para consultas com cache inteligente
 */
export function useOptimizedQuery<T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) {
  const queryClient = useQueryClient();
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutos
    enableOfflineCache = true,
    optimisticUpdate = false,
    backgroundRefetch = true,
    ...queryOptions
  } = options;

  // Chave de cache otimizada
  const cacheKey = useMemo(() => 
    queryKey.join('-'), 
    [queryKey]
  );

  // Query function otimizada com cache
  const optimizedQueryFn = useCallback(async (): Promise<T> => {
    logger.time(`query-${cacheKey}`, 'useOptimizedQuery');
    
    try {
      // Tentar cache local primeiro se offline cache estiver habilitado
      if (enableOfflineCache) {
        const cachedData = performanceCache.get<T>(cacheKey);
        if (cachedData) {
          logger.debug(`Cache hit for ${cacheKey}`, undefined, 'useOptimizedQuery');
          return cachedData;
        }
      }

      // Executar query
      const result = await queryFn();

      // Salvar no cache local
      if (enableOfflineCache) {
        performanceCache.set(cacheKey, result, cacheTime);
      }

      logger.timeEnd(`query-${cacheKey}`, 'useOptimizedQuery');
      return result;

    } catch (error) {
      logger.error(`Query failed for ${cacheKey}`, error, undefined, 'useOptimizedQuery');
      
      // Tentar cache como fallback em caso de erro
      if (enableOfflineCache) {
        const cachedData = performanceCache.get<T>(cacheKey);
        if (cachedData) {
          logger.warn(`Using cached data as fallback for ${cacheKey}`, undefined, 'useOptimizedQuery');
          return cachedData;
        }
      }
      
      throw error;
    }
  }, [queryFn, cacheKey, enableOfflineCache, cacheTime]);

  // Configurar query com otimizações
  const query = useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: backgroundRefetch ? cacheTime / 2 : cacheTime,
    gcTime: cacheTime * 2,
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Retry inteligente baseado no tipo de erro
      if (failureCount >= 3) return false;
      
      // Não retry para erros de autenticação
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) return false;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions
  });

  // Métodos otimizados para atualizações
  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    if (enableOfflineCache) {
      performanceCache.delete(cacheKey);
    }
  }, [queryClient, queryKey, enableOfflineCache, cacheKey]);

  const updateQueryData = useCallback((updater: (old: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, updater);
    
    if (enableOfflineCache) {
      const newData = queryClient.getQueryData<T>(queryKey);
      if (newData) {
        performanceCache.set(cacheKey, newData, cacheTime);
      }
    }
  }, [queryClient, queryKey, enableOfflineCache, cacheKey, cacheTime]);

  const prefetchQuery = useCallback(() => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn: optimizedQueryFn,
      staleTime: cacheTime
    });
  }, [queryClient, queryKey, optimizedQueryFn, cacheTime]);

  return {
    ...query,
    invalidateQuery,
    updateQueryData,
    prefetchQuery,
    cacheKey
  };
}