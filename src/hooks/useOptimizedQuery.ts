import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { memoryCache } from '@/utils/performance';

/**
 * Hook otimizado para queries com cache em memória
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const cacheKey = queryKey.join(':');
      const cached = memoryCache.get(cacheKey);
      
      if (cached && !options?.refetchOnWindowFocus) {
        return cached;
      }
      
      const result = await queryFn();
      memoryCache.set(cacheKey, result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (era cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options
  });
}